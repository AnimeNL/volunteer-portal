// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { Event, EventLocation, EventVolunteer } from './Event';
import { IEventResponse, IEventResponseLocation, IEventResponseVolunteer } from '../api/IEvent';

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

        for (const location of event.locations) {
            const instance = new EventLocationImpl(location);

            if (!this.#areas.has(instance.area))
                this.#areas.set(instance.area, new Set());

            this.#areas.get(instance.area)?.add(instance);
            this.#locations.set(instance.name, instance);
        }

        for (const volunteer of event.volunteers)
            this.#volunteers.set(volunteer.identifier, new EventVolunteerImpl(volunteer));
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
 * Implementation of the EventLocation interface, which abstracts over the IEventResponseLocation
 * response information and adds the ability to cross-reference information.
 */
class EventLocationImpl implements EventLocation {
    #response: IEventResponseLocation;

    constructor(response: IEventResponseLocation) {
        this.#response = response;
    }

    get area() { return this.#response.area; }
    get name() { return this.#response.name; }
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
