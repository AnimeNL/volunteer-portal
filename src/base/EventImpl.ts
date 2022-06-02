// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { ApiRequest } from './ApiRequest';
import { ApiRequestManager, ApiRequestObserver } from './ApiRequestManager';
import { DateTime } from './DateTime';

import type { Event, EventArea, EventInfo, EventLocation, EventSession, EventShift,
              EventVolunteer } from './Event';
import type { IAvatarRequest } from '../api/IAvatar';
import type { IEventRequest, IEventResponse, IEventResponseArea, IEventResponseEvent,
              IEventResponseLocation, IEventResponseMeta, IEventResponsePrivilege,
              IEventResponseSession, IEventResponseShift,
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

    private observers: Set<Invalidatable> = new Set();

    // Information made available after the Event was successfully retrieved.
    #meta?: IEventResponseMeta;
    #nardo?: Record<string, number>;
    #privileges: Set<string> = new Set();

    #startTime?: DateTime;
    #endTime?: DateTime;

    #areas: Map<string, EventAreaImpl> = new Map();
    #events: Map<string, EventInfoImpl> = new Map();
    #locations: Map<string, EventLocationImpl> = new Map();
    #volunteers: Map<string, EventVolunteerImpl> = new Map();

    constructor(request: IEventRequest) {
        this.requestManager = new ApiRequestManager('IEvent', this);
        this.request = request;
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

        DateTime.setDefaultTimezone(response.meta.timezone);

        // (1) Reset all the locally cached information to an empty state.
        this.#meta = response.meta;
        this.#nardo = response.nardo;
        this.#privileges = new Set(response.userPrivileges);

        this.#startTime = DateTime.fromUnix(response.meta.time[0]);
        this.#endTime = DateTime.fromUnix(response.meta.time[1]);

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

        // (4) Initialize all the event and session information.
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

            this.#events.set(instance.identifier, instance);

            finalizationQueue.push(instance);
        }

        // (5) Initialize all the volunteer information.
        for (const volunteer of response.volunteers) {
            this.#volunteers.set(
                volunteer.identifier, new EventVolunteerImpl(this.request.event, volunteer,
                                                             this.#events));
        }

        // (7) Run all the finalizers to make sure that the data is in order.
        for (const instance of finalizationQueue)
            instance.finalize();

        for (const observer of this.observers)
            observer.invalidate();
    }

    // ---------------------------------------------------------------------------------------------
    // Event interface implementation
    // ---------------------------------------------------------------------------------------------

    get initialized() { return !!this.#meta; }
    get identifier() { return this.request.event; }

    get nardo() {
        if (!this.#meta)
            throw new Error(kExceptionMessage);

        return this.#nardo;
    }

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

    get startTime() {
        if (!this.#startTime)
            throw new Error(kExceptionMessage);

        return this.#startTime;
    }

    get endTime() {
        if (!this.#endTime)
            throw new Error(kExceptionMessage);

        return this.#endTime;
    }

    // ---------------------------------------------------------------------------------------------
    // Observer API
    // ---------------------------------------------------------------------------------------------

    addObserver(observer: Invalidatable): void {
        this.observers.add(observer);
    }

    removeObserver(observer: Invalidatable): void {
        this.observers.delete(observer);
    }

    // ---------------------------------------------------------------------------------------------
    // Event API
    // ---------------------------------------------------------------------------------------------

    event(identifier: string): EventInfo | undefined {
        return this.#events.get(identifier);
    }

    events(): IterableIterator<EventInfo> {
        return this.#events.values();
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
    // User API
    // ---------------------------------------------------------------------------------------------

    hasUserPrivilege(privilege: IEventResponsePrivilege): boolean {
        return this.#privileges.has(privilege);
    }

    // ---------------------------------------------------------------------------------------------
    // Volunteer API
    // ---------------------------------------------------------------------------------------------

    volunteer(identifier: string): EventVolunteer | undefined {
        return this.#volunteers.get(identifier);
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
    #notes: string | undefined;
    #sessions: EventSession[];
    #shifts: EventShift[];

    constructor(response: IEventResponseEvent) {
        this.#identifier = response.identifier;
        this.#hidden = response.hidden;
        this.#notes = response.notes;
        this.#sessions = [];
        this.#shifts = [];
    }

    addShift(shift: EventShift): void {
        this.#shifts.push(shift);
    }

    createSession(location: EventLocation, response: IEventResponseSession): EventSessionImpl {
        const session = new EventSessionImpl(this, location, response);

        this.#sessions.push(session);
        return session;
    }

    finalize() {
        // Sort the sessions and shifts by their start time, in ascending order.
        this.#sessions.sort(AscendingSessionComparator);
        this.#shifts.sort((lhs, rhs) => {
            const diff = lhs.startTime.valueOf() - rhs.startTime.valueOf();
            if (!diff)
                return lhs.volunteer.name.localeCompare(rhs.volunteer.name);

            return diff;
        });
    }

    get identifier() { return this.#identifier; }
    get hidden() { return this.#hidden; }
    set notes(value: string | undefined) { this.#notes = value; }
    get notes() { return this.#notes; }
    get sessions() { return this.#sessions; }
    get shifts() { return this.#shifts; }
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
 * response information. Times will be represented by a DateTime instance.
 */
class EventSessionImpl implements EventSession {
    #event: EventInfo;
    #location: EventLocation;

    #name: string;
    #description?: string;

    #beginTime: DateTime;
    #endTime: DateTime;

    constructor(event: EventInfo, location: EventLocation, response: IEventResponseSession) {
        this.#event = event;
        this.#location = location;

        this.#name = response.name;
        this.#description = response.description;

        this.#beginTime = DateTime.fromUnix(response.time[0]);
        this.#endTime = DateTime.fromUnix(response.time[1]);
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
    #notes: string | undefined;
    #response: IEventResponseVolunteer;
    #shifts: EventShiftImpl[] = [];

    // The avatar as it has been uploaded during this session, if any.
    #uploadedAvatarUrl?: string;

    constructor(eventIdentifier: string, response: IEventResponseVolunteer,
                events: Map<string, EventInfoImpl>) {
        this.#eventIdentifier = eventIdentifier;
        this.#notes = response.notes;
        this.#response = response;

        if (response.shifts) {
            for (const shift of response.shifts) {
                let instance: EventShiftImpl | null = null;
                switch (shift.type) {
                    case 'available':
                    case 'unavailable':
                        instance = new EventShiftImpl(shift, this);
                        break;

                    case 'shift':
                        if (!shift.event || !events.has(shift.event)) {
                            console.warn('Invalid shift for volunteer ' + response.name);
                            break;
                        }

                        const event = events.get(shift.event)!;

                        instance = new EventShiftImpl(shift, this, event);
                        event.addShift(instance);
                        break;
                }

                if (instance)
                    this.#shifts.push(instance);
            }
        }
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
    set notes(value: string | undefined) { this.#notes = value; }
    get notes() { return this.#notes; }
    get phoneNumber() { return this.#response.phoneNumber; }
    get shifts() { return this.#shifts; }
}

/**
 * Implementation of the EventShift interface, which abstracts over the IEventResponseShift response
 * information with a slightly more accessible API.
 */
class EventShiftImpl implements EventShift {
    #type: 'available' | 'shift' | 'unavailable';
    #name: string;

    #event?: EventInfo;
    #volunteer: EventVolunteer;

    #startTime: DateTime;
    #endTime: DateTime;

    constructor(response: IEventResponseShift, volunteer: EventVolunteer, event?: EventInfo) {
        this.#type = response.type;
        this.#name = response.name || (event && event.sessions[0].name) || 'Volunteering Shift';

        this.#event = event;
        this.#volunteer = volunteer;

        this.#startTime = DateTime.fromUnix(response.time[0]);
        this.#endTime = DateTime.fromUnix(response.time[1]);
    }

    get type() { return this.#type; }
    get event() { return this.#event; }
    get name() { return this.#name; }
    get volunteer() { return this.#volunteer; }
    get startTime() { return this.#startTime; }
    get endTime() { return this.#endTime; }
}
