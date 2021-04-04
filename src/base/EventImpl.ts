// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { Event, EventVolunteer } from './Event';
import { IEventResponse, IEventResponseVolunteer } from '../api/IEvent';

/**
 * Implementation of the Event interface. Instances should only be created through the EventFactory,
 * unless tests are being ran which specifically verify behaviour of this class' functionality.
 */
export class EventImpl implements Event {
    #identifier: string;

    #volunteers: Map<string, EventVolunteerImpl> = new Map();

    constructor(identifier: string, event: IEventResponse) {
        this.#identifier = identifier;

        for (const volunteer of event.volunteers)
            this.#volunteers.set(volunteer.identifier, new EventVolunteerImpl(volunteer));
    }

    get identifier() { return this.#identifier; }

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
