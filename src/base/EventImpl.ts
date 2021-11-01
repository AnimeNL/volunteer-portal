// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import moment from 'moment-timezone';

import { Event, EventArea, EventInfo, EventLocation, EventSession, EventVolunteer } from './Event';
import { IEventResponse, IEventResponseArea, IEventResponseEvent, IEventResponseLocation,
         IEventResponseSession, IEventResponseVolunteer } from '../api/IEvent';

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
 * Implementation of the Event interface. Instances should only be created through the EventFactory,
 * unless tests are being ran which specifically verify behaviour of this class' functionality.
 */
export class EventImpl implements Event {
    #identifier: string;

    #areas: Map<string, EventAreaImpl> = new Map();
    #locations: Map<string, EventLocationImpl> = new Map();
    #sessions: EventSession[];
    #volunteers: Map<string, EventVolunteerImpl> = new Map();

    constructor(identifier: string, event: IEventResponse) {
        this.#identifier = identifier;
        this.#sessions = [];

        let finalizationQueue: Finalizer[] = [];

        // (1) Initialize all the area information.
        for (const area of event.areas) {
            const instance = new EventAreaImpl(area);

            this.#areas.set(area.identifier, instance);

            finalizationQueue.push(instance);
        }

        // (1) Initialize all the location information.
        for (const location of event.locations) {
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

        // (2) Initialize all the volunteer information.
        for (const volunteer of event.volunteers)
            this.#volunteers.set(volunteer.identifier, new EventVolunteerImpl(volunteer));

        // (3) Initialize all the event and session information.
        for (const eventInfo of event.events) {
            const instance = new EventInfoImpl(eventInfo);

            for (const sessionInfo of eventInfo.sessions) {
                const location = this.#locations.get(sessionInfo.location);
                if (!location) {
                    console.warn('Invalid location given for event session.', sessionInfo, event);
                    continue;
                }

                const session = instance.createSession(location, sessionInfo);
                this.#sessions.push(session);

                location.addSession(session);
            }

            finalizationQueue.push(instance);
        }

        // (4) Run all the finalizers to make sure that the data is in order.
        for (const instance of finalizationQueue)
            instance.finalize();

        // (5) Sort the master session list to enable quick access to live events.
        this.#sessions.sort(AscendingSessionComparator);
    }

    get identifier() { return this.#identifier; }

    // ---------------------------------------------------------------------------------------------
    // Event API
    // ---------------------------------------------------------------------------------------------

    getActiveSessions(time: moment.Moment): EventSession[] {
        const timeValue = time.valueOf();
        const results: EventSession[] = [];

        for (const session of this.#sessions) {
            if (session.endTime.valueOf() <= timeValue)
                continue;  // the |session| ends before |timeValue|

            if (session.startTime.valueOf() > timeValue)
                continue;  // the |session| starts after |timeValue|

            results.push(session);
        }

        return results;
    }

    // ---------------------------------------------------------------------------------------------
    // Location API
    // ---------------------------------------------------------------------------------------------

    getAreas(): IterableIterator<EventArea> {
        return this.#areas.values();
    }

    getLocation(identifier: string): EventLocation | undefined {
        return this.#locations.get(identifier);
    }

    getLocations(): IterableIterator<EventLocation> {
        return this.#locations.values();
    }

    // ---------------------------------------------------------------------------------------------
    // Volunteer API
    // ---------------------------------------------------------------------------------------------

    getVolunteer(identifier: string): EventVolunteer | undefined {
        return this.#volunteers.get(identifier);
    }

    getVolunteers(): IterableIterator<EventVolunteer> {
        return this.#volunteers.values();
    }
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

    createSession(location: EventLocation, response: IEventResponseSession): EventSession {
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
class EventSessionImpl implements EventSession {
    #event: EventInfo;
    #location: EventLocation;

    #name: string;
    #description?: string;

    #beginTime: moment.Moment;
    #endTime: moment.Moment;

    constructor(event: EventInfo, location: EventLocation, response: IEventResponseSession) {
        this.#event = event;
        this.#location = location;

        this.#name = response.name;
        this.#description = response.description;

        this.#beginTime = moment(response.time[0] * 1000);
        this.#endTime = moment(response.time[1] * 1000);
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
    #response: IEventResponseVolunteer;

    constructor(response: IEventResponseVolunteer) {
        this.#response = response;
    }

    get name() { return `${this.#response.name[0]} ${this.#response.name[1]}`.trim(); }
    get firstName() { return this.#response.name[0]; }
    get lastName() { return this.#response.name[1]; }
    get environments() { return this.#response.environments; }
    get identifier() { return this.#response.identifier; }
    get accessCode() { return this.#response.accessCode; }
    get avatar() { return this.#response.avatar; }
    get phoneNumber() { return this.#response.phoneNumber; }
}
