// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { ApiRequestManager, ApiRequestObserver } from './ApiRequestManager';

import type { Event, EventArea, EventLocation, EventSession, EventVolunteer } from './Event';
import type { IEventRequest, IEventResponse, IEventResponseArea, IEventResponseMeta } from '../api/IEvent';
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

    #areas: Map<string, EventAreaImpl> = new Map();

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

        // (1) Reset all the locally cached information to an empty state.
        this.#meta = response.meta;

        this.#areas = new Map();

        // (2) Initialize all the area information.
        for (const area of response.areas) {
            const instance = new EventAreaImpl(area);

            this.#areas.set(area.identifier, instance);

            finalizationQueue.push(instance);
        }

        // (3) Run all the finalizers to make sure that the data is in order.
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

    getActiveSessions(time: moment.Moment): EventSession[] {
        return [];
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

    getLocation(identifier: string): EventLocation | undefined {
        return undefined;
    }

    getLocations(): IterableIterator<EventLocation> {
        return (new Map).values();
    }

    // ---------------------------------------------------------------------------------------------
    // Volunteer API
    // ---------------------------------------------------------------------------------------------

    getVolunteer(identifier: string): EventVolunteer | undefined {
        return undefined;
    }

    getVolunteerByName(name: string): EventVolunteer | undefined {
        return undefined;
    }

    getVolunteers(): IterableIterator<EventVolunteer> {
        return (new Map).values();
    }
}

/**
 * Interface that enables certain objects to be finalized after event initialization is complete.
 */
 interface Finalizer { finalize(): void; }

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
