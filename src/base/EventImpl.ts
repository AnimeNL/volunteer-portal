// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { ApiRequestManager, ApiRequestObserver } from './ApiRequestManager';

import type { Event, EventArea, EventLocation, EventSession, EventVolunteer } from './Event';
import type { IEventRequest, IEventResponse, IEventResponseMeta } from '../api/IEvent';
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
    private meta?: IEventResponseMeta;

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
        this.meta = response.meta;

        if (this.observer)
            this.observer.invalidate();
    }

    // ---------------------------------------------------------------------------------------------
    // Event interface implementation
    // ---------------------------------------------------------------------------------------------

    get initialized() { return !!this.meta; }
    get identifier() { return this.request.event; }
    get name() {
        if (!this.meta)
            throw new Error(kExceptionMessage);

        return this.meta.name;
    }

    get timezone() {
        if (!this.meta)
            throw new Error(kExceptionMessage);

        return this.meta.timezone;
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

    getAreas(): IterableIterator<EventArea> {
        return (new Map).values();
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
