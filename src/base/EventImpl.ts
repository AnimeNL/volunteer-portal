// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import moment from 'moment-timezone';

import { Event, EventInfo, EventLocation, EventSession, EventVolunteer } from './Event';
import { IEventResponse, IEventResponseEvent, IEventResponseLocation,
         IEventResponseSession, IEventResponseVolunteer } from '../api/IEvent';

/**
 * Interface that enables certain objects to be finalized after event initialization is complete.
 */
interface Finalizer { finalize(): void; }

/**
 * Implementation of the Event interface. Instances should only be created through the EventFactory,
 * unless tests are being ran which specifically verify behaviour of this class' functionality.
 */
export class EventImpl implements Event {
    #identifier: string;

    #areas: Map<string, Set<any>> = new Map();
    #locations: Map<string, EventLocationImpl> = new Map();
    #volunteers: Map<string, EventVolunteerImpl> = new Map();

    constructor(identifier: string, event: IEventResponse) {
        this.#identifier = identifier;

        let finalizationQueue: Finalizer[] = [];

        // (1) Initialize all the location information.
        for (const location of event.locations) {
            const instance = new EventLocationImpl(location);

            if (!this.#areas.has(instance.area))
                this.#areas.set(instance.area, new Set());

            this.#areas.get(instance.area)?.add(instance);
            this.#locations.set(instance.name, instance);

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

                // TODO: Store the sessions in a separate array to cheaply be able to determine
                // which events are active at a particular time.

                location.addSession(session);
            }

            finalizationQueue.push(instance);
        }

        // (4) Run all the finalizers to make sure that the data is in order.
        for (const instance of finalizationQueue)
            instance.finalize();
    }

    get identifier() { return this.#identifier; }

    // ---------------------------------------------------------------------------------------------
    // Location API
    // ---------------------------------------------------------------------------------------------

    getAreas(): IterableIterator<string> {
        return this.#areas.keys();
    }

    getLocation(name: string): EventLocation | undefined {
        return this.#locations.get(name);
    }

    getLocations(): IterableIterator<EventLocation> {
        return this.#locations.values();
    }

    getLocationsForArea(area: string): IterableIterator<EventLocation> {
        return (this.#areas.get(area) || []).values();
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
 * Implementation of the EventInfo interface, which abstracts over the IEventResponseEvent response
 * information.
 */
class EventInfoImpl implements EventInfo, Finalizer {
    #title: string;
    #description: string;
    #sessions: EventSession[];

    constructor(response: IEventResponseEvent) {
        this.#title = response.title;
        this.#description = response.description;
        this.#sessions = [];
    }

    createSession(location: EventLocation, response: IEventResponseSession): EventSession {
        const session = new EventSessionImpl(this, location, response);

        this.#sessions.push(session);
        return session;
    }

    finalize() {
        // Sort the sessions by their start time, in ascending order.
        this.#sessions.sort((lhs, rhs) => lhs.startTime.valueOf() - rhs.startTime.valueOf());
    }

    get title() { return this.#title; }
    get description() { return this.#description; }
    get sessions() { return this.#sessions; }
}

/**
 * Implementation of the EventLocation interface, which abstracts over the IEventResponseLocation
 * response information and adds the ability to cross-reference information.
 */
class EventLocationImpl implements EventLocation, Finalizer {
    #response: IEventResponseLocation;
    #sessions: EventSession[];

    constructor(response: IEventResponseLocation) {
        this.#response = response;
        this.#sessions = [];
    }

    addSession(session: EventSession) {
        this.#sessions.push(session);
    }

    finalize() {
        // Sort the sessions by their start time, in ascending order.
        this.#sessions.sort((lhs, rhs) => lhs.startTime.valueOf() - rhs.startTime.valueOf());
    }

    get area() { return this.#response.area; }
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

    #beginTime: moment.Moment;
    #endTime: moment.Moment;

    constructor(event: EventInfo, location: EventLocation, response: IEventResponseSession) {
        this.#event = event;
        this.#location = location;

        this.#beginTime = moment(response.time[0] * 1000);
        this.#endTime = moment(response.time[1] * 1000);
    }

    get event() { return this.#event; }
    get location() { return this.#location; }

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
    get identifier() { return this.#response.identifier; }
    get avatar() { return this.#response.avatar; }
}
