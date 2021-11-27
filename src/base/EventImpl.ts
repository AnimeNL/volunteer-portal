// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import moment from 'moment-timezone';

import { ApiRequest } from './ApiRequest';
import { ApiRequestManager, ApiRequestObserver } from './ApiRequestManager';
import { IntervalTree, IntervalTreeNode } from './IntervalTree';

import type { Event, EventArea, EventInfo, EventLocation, EventSession,
              EventVolunteer } from './Event';
import type { IAvatarRequest } from '../api/IAvatar';
import type { IEventRequest, IEventResponse, IEventResponseArea, IEventResponseEvent,
              IEventResponseLocation, IEventResponseMeta, IEventResponseSession,
              IEventResponseVolunteer } from '../api/IEvent';
import type { Invalidatable } from './Invalidatable';

/**
 * Message to include with the exception thrown when data is being accessed before the event has
 * been fully initialized, either from the network or from local cache.
 */
const kExceptionMessage = 'The Event object has not been successfully initialized yet.';

/**
 * Provides the ability to initialize and maintain event information for a particular event, either
 * from the network or from the local cache. Instances are strictly tied to a single { event, user }
 * combination, changes in those values must be reflected by creating a new instance.
 */
export class EventImpl implements ApiRequestObserver<'IEvent'>, Event {
    private requestManager: ApiRequestManager<'IEvent'>;
    private request: IEventRequest;

    private observer?: Invalidatable;

    // Information made available after the Event was successfully retrieved.
    #meta?: IEventResponseMeta;
    #sessions?: IntervalTree<EventSessionImpl>;

    #areas: Map<string, EventAreaImpl> = new Map();
    #locations: Map<string, EventLocationImpl> = new Map();
    #volunteers: Map<string, EventVolunteerImpl> = new Map();

    constructor(request: IEventRequest, observer?: Invalidatable) {
        this.requestManager = new ApiRequestManager('IEvent', this);
        this.request = request;

        this.observer = observer;
    }

    /**
     * Asynchronously initializes the Event information. This method can be called multiple times
     * in case the event information should be (re)synchronized with the server.
     */
    async initialize(): Promise<boolean> {
        return this.requestManager.issue(this.request);
    }

    // ---------------------------------------------------------------------------------------------
    // ApiRequestObserver interface implementation
    // ---------------------------------------------------------------------------------------------

    onFailedResponse(error: Error) { /* handled in the App */ }
    onSuccessResponse(response: IEventResponse) {
        let finalizationQueue: Finalizer[] = [];
        let sessions: EventSessionImpl[] = [];

        // (1) Reset all the locally cached information to an empty state.
        this.#meta = response.meta;

        this.#areas = new Map();
        this.#locations = new Map();
        this.#volunteers = new Map();

        // (2) Initialize all the area information.
        for (const area of response.areas) {
            const instance = new EventAreaImpl(area);

            this.#areas.set(area.identifier, instance);

            finalizationQueue.push(instance);
        }

        // (3) Initialize all the location information.
        for (const location of response.locations) {
            const area = this.#areas.get(location.area);
            if (!area) {
                console.warn('Invalid area given for location. Ignoring.', location);
                continue;
            }

            const instance = new EventLocationImpl(location, area);

            this.#locations.set(instance.identifier, instance);
            area.addLocation(instance);

            finalizationQueue.push(instance);
        }

        // (4) Initialize all the volunteer information.
        for (const volunteer of response.volunteers) {
            this.#volunteers.set(
                volunteer.identifier, new EventVolunteerImpl(this.request.event, volunteer));
        }

        // (5) Initialize all the event and session information.
        for (const eventInfo of response.events) {
            const instance = new EventInfoImpl(eventInfo);

            for (const sessionInfo of eventInfo.sessions) {
                const location = this.#locations.get(sessionInfo.location);
                if (!location) {
                    console.warn('Invalid location given for session.', sessionInfo, response);
                    continue;
                }

                const session = instance.createSession(location, sessionInfo);

                location.addSession(session);
                sessions.push(session);
            }

            finalizationQueue.push(instance);
        }

        // (6) Initialize the interval tree for the active sessions during this event.
        this.#sessions = new IntervalTree(sessions);

        // (7) Run all the finalizers to make sure that the data is in order.
        for (const instance of finalizationQueue)
            instance.finalize();

        if (this.observer)
            this.observer.invalidate();
    }

    // ---------------------------------------------------------------------------------------------
    // Event interface implementation
    // ---------------------------------------------------------------------------------------------

    get initialized() { return !!this.#meta; }
    get identifier() { return this.request.event; }
    get name() {
        if (!this.#meta)
            throw new Error(kExceptionMessage);

        return this.#meta.name;
    }

    get timezone() {
        if (!this.#meta)
            throw new Error(kExceptionMessage);

        return this.#meta.timezone;
    }

    // ---------------------------------------------------------------------------------------------
    // Event API
    // ---------------------------------------------------------------------------------------------

    /**
     * Finds the active sessions at the given |time|, which defaults to the current time. The search
     * is done using an interval tree, to allow for O(log n + k) search times.
     */
    findActiveSessions(time?: moment.Moment): EventSession[] {
        if (!this.#sessions)
            throw new Error(kExceptionMessage);

        const queryTime = time ?? moment();

        return this.#sessions.query({ point: queryTime.unix() });
    }

    // ---------------------------------------------------------------------------------------------
    // Location API
    // ---------------------------------------------------------------------------------------------

    area(identifier: string): EventArea | undefined {
        return this.#areas.get(identifier);
    }

    areas(): IterableIterator<EventArea> {
        return this.#areas.values();
    }

    location(identifier: string): EventLocation | undefined {
        return this.#locations.get(identifier);
    }

    locations(): IterableIterator<EventLocation> {
        return this.#locations.values();
    }

    // ---------------------------------------------------------------------------------------------
    // Volunteer API
    // ---------------------------------------------------------------------------------------------

    volunteer(query: { identifier?: string; name?: string; }): EventVolunteer | undefined {
        if (query.identifier) {
            return this.#volunteers.get(query.identifier);
        } else if (query.name) {
            for (const [ _, volunteer ] of this.#volunteers) {
                if (volunteer.name === query.name)
                    return volunteer;
            }
        }

        return undefined;
    }

    volunteers(): IterableIterator<EventVolunteer> {
        return this.#volunteers.values();
    }
}

/**
 * Interface that enables certain objects to be finalized after event initialization is complete.
 */
interface Finalizer { finalize(): void; }

/**
 * Comparator to use when an array containing sessions should be sorted in ascending order. A stable
 * sort is used where, for equal start times, the events will then be sorted by end time.
 */
function AscendingSessionComparator(lhs: EventSession, rhs: EventSession) {
    const lhsValue = lhs.startTime.valueOf();
    const rhsValue = rhs.startTime.valueOf();

    const diff = lhsValue - rhsValue;
    if (!diff)
        return lhs.endTime.valueOf() - rhs.endTime.valueOf();

    return diff;
}

/**
 * Implementation of the EventArea interface, which abstracts over the IEventResponseArea data.
 */
class EventAreaImpl implements EventArea, Finalizer {
    #response: IEventResponseArea;
    #locations: EventLocation[];

    constructor(response: IEventResponseArea) {
        this.#response = response;
        this.#locations = [];
    }

    addLocation(location: EventLocation) {
        this.#locations.push(location);
    }

    finalize() {
        this.#locations.sort((lhs, rhs) => lhs.name.localeCompare(rhs.name));
    }

    get identifier() { return this.#response.identifier; }
    get name() { return this.#response.name; }
    get icon() { return this.#response.icon; }
    get locations() { return this.#locations; }
}

/**
 * Implementation of the EventInfo interface, which abstracts over the IEventResponseEvent response
 * information.
 */
class EventInfoImpl implements EventInfo, Finalizer {
    #identifier: string;
    #hidden: boolean;
    #sessions: EventSession[];

    constructor(response: IEventResponseEvent) {
        this.#identifier = response.identifier;
        this.#hidden = response.hidden;
        this.#sessions = [];
    }

    createSession(location: EventLocation, response: IEventResponseSession): EventSessionImpl {
        const session = new EventSessionImpl(this, location, response);

        this.#sessions.push(session);
        return session;
    }

    finalize() {
        // Sort the sessions by their start time, in ascending order.
        this.#sessions.sort(AscendingSessionComparator);
    }

    get identifier() { return this.#identifier; }
    get hidden() { return this.#hidden; }
    get sessions() { return this.#sessions; }
}

/**
 * Implementation of the EventLocation interface, which abstracts over the IEventResponseLocation
 * response information and adds the ability to cross-reference information.
 */
class EventLocationImpl implements EventLocation, Finalizer {
    #response: IEventResponseLocation;

    #area: EventAreaImpl;
    #sessions: EventSession[];

    constructor(response: IEventResponseLocation, area: EventAreaImpl) {
        this.#response = response;

        this.#area = area;
        this.#sessions = [];
    }

    addSession(session: EventSession) {
        this.#sessions.push(session);
    }

    finalize() {
        // Sort the sessions by their start time, in ascending order.
        this.#sessions.sort(AscendingSessionComparator);
    }

    get identifier() { return this.#response.identifier; }
    get area() { return this.#area; }
    get name() { return this.#response.name; }
    get sessions() { return this.#sessions; }
}

/**
 * Implementation of the EventSession interface, which abstracts over the IEventResponseSession
 * response information. Times will be represented by MomentJS.
 */
class EventSessionImpl implements EventSession, IntervalTreeNode {
    #event: EventInfo;
    #location: EventLocation;

    #name: string;
    #description?: string;

    #beginTime: moment.Moment;
    #endTime: moment.Moment;

    // IntervalTreeNode implementation:
    public start: number;
    public end: number;

    constructor(event: EventInfo, location: EventLocation, response: IEventResponseSession) {
        this.#event = event;
        this.#location = location;

        this.#name = response.name;
        this.#description = response.description;

        this.#beginTime = moment(response.time[0] * 1000);
        this.#endTime = moment(response.time[1] * 1000);

        this.start = response.time[0];
        this.end = response.time[1];
    }

    get event() { return this.#event; }
    get location() { return this.#location; }

    get name() { return this.#name; }
    get description() { return this.#description; }

    get startTime() { return this.#beginTime; }
    get endTime() { return this.#endTime; }
}

/**
 * Implementation of the EventVolunteer interface, which abstracts over the IEventResponseVolunteer
 * response information with a slightly more accessible API.
 */
class EventVolunteerImpl implements EventVolunteer {
    #eventIdentifier: string;
    #response: IEventResponseVolunteer;

    // The avatar as it has been uploaded during this session, if any.
    #uploadedAvatarUrl?: string;

    constructor(eventIdentifier: string, response: IEventResponseVolunteer) {
        this.#eventIdentifier = eventIdentifier;
        this.#response = response;
    }

    async uploadAvatar(request: Omit<IAvatarRequest, 'event' | 'userToken'>): Promise<boolean> {
        try {
            const apiRequest = new ApiRequest('IAvatar');
            const apiResponse = await apiRequest.issue({
                ...request,

                // Information that can be sourced from |this| volunteer.
                event: this.#eventIdentifier,
                userToken: this.#response.identifier,
            });

            if (apiResponse.error) {
                console.error('Unable to upload the avatar:', apiResponse.error);
            } else {
                this.#uploadedAvatarUrl = URL.createObjectURL(request.avatar);
            }

            return apiResponse.error === undefined;

        } catch (exception) {
            console.error('Unable to interact with the authentication API:', exception);
        }

        return false;
    }

    get name() { return `${this.#response.name[0]} ${this.#response.name[1]}`.trim(); }
    get firstName() { return this.#response.name[0]; }
    get lastName() { return this.#response.name[1]; }
    get environments() { return this.#response.environments; }
    get identifier() { return this.#response.identifier; }
    get accessCode() { return this.#response.accessCode; }
    get avatar() { return this.#uploadedAvatarUrl ?? this.#response.avatar; }
    get phoneNumber() { return this.#response.phoneNumber; }
}
