// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { Cache } from './Cache';
import { CachedLoader } from './CachedLoader';
import { Configuration } from './Configuration';
import { Event } from './Event';
import { EventImpl } from './EventImpl';
import { IEventResponse, IEventResponseEvent, IEventResponseLocation,
         IEventResponseSession, IEventResponseVolunteer } from '../api/IEvent';

import { issueErrorAndReturnFalse, validateArray, validateNumber,
         validateOptionalString, validateString } from './TypeValidators';

/**
 * Provides the necessary functionality to load an initialized `Event` instance. This is an
 * asynchronous process that may involve loading data from the network.
 */
export class EventFactory {
    public static kCacheKeyPrefix: string = 'portal-event-';

    #configuration: Configuration;
    #loader: CachedLoader;

    constructor(cache: Cache, configuration: Configuration) {
        this.#configuration = configuration;
        this.#loader = new CachedLoader(cache);
    }

    /**
     * Asynchronously vends an object that adheres to the Event interface. Will attempt to load the
     * information from the network and the cache asynchronously. Undefined will be returned when
     * the information cannot be loaded at all, for example because the `identifier` is invalid.
     *
     * @param authToken Authentication token of the signed in user, to specify privileges.
     * @param identifier Unique identifier of the event for which data should be loaded.
     */
    async load(authToken: string, identifier: string): Promise<Event | undefined> {
        const response = await this.#loader.initialize({
            cacheKey: EventFactory.cacheKeyForIdentifier(identifier),
            url: this.#configuration.getEventEndpoint(authToken, identifier),
            validationFn: EventFactory.prototype.validateEventResponse.bind(this),
        });

        if (response)
            return new EventImpl(identifier, response);
    }

    /**
     * Validates the given |response| as data given in the IEventResponse response format. Error
     * messages will be sent to the console's error buffer if the data could not be verified.
     */
    private validateEventResponse(response: any): response is IEventResponse {
        const kInterfaceName = 'IEventResponse';

        if (!validateArray(response, kInterfaceName, 'events'))
            return false;

        for (const event of response.events) {
            if (!this.validateEventResponseEvent(event))
                return false;
        }

        if (!validateArray(response, kInterfaceName, 'locations'))
            return false;

        for (const location of response.locations) {
            if (!this.validateEventResponseLocation(location))
                return false;
        }

        if (!validateArray(response, kInterfaceName, 'volunteers'))
            return false;

        for (const volunteer of response.volunteers) {
            if (!this.validateEventResponseVolunteer(volunteer))
                return false;
        }

        return true;
    }

    /**
     * Validates that the given |event| corresponds to the IEventResponseEvent structure.
     */
    private validateEventResponseEvent(event: any): event is IEventResponseEvent {
        const kInterfaceName = 'IEventResponseEvent';

        if (!validateArray(event, kInterfaceName, 'sessions'))
            return false;

        for (const session of event.sessions) {
            if (!this.validateEventResponseSession(session))
                return false;
        }

        return validateString(event, kInterfaceName, 'title') &&
               validateString(event, kInterfaceName, 'description');
    }

    /**
     * Validates that the given |location| corresponds to the IEventResponseLocation structure.
     */
    private validateEventResponseLocation(location: any): location is IEventResponseLocation {
        const kInterfaceName = 'IEventResponseLocation';

        return validateString(location, kInterfaceName, 'name') &&
               validateString(location, kInterfaceName, 'area');
    }

    /**
     * Validates that the given |session| corresponds to the IEventResponseSession structure.
     */
    private validateEventResponseSession(session: any): session is IEventResponseSession {
        const kInterfaceName = 'IEventResponseSession';

        if (!validateArray(session, kInterfaceName, 'time'))
            return false;

        if (session.time.length !== 2)
            return issueErrorAndReturnFalse(kInterfaceName, 'time', 'should have a length of 2');

        for (let index = 0; index < session.time.length; ++index) {
            if (!validateNumber(session.time, kInterfaceName + '.time', index))
                return false;
        }

        return validateString(session, kInterfaceName, 'location');
    }

    /**
     * Validates that the given |volunteer| corresponds to the IEventResponseVolunteer structure.
     */
    private validateEventResponseVolunteer(volunteer: any): volunteer is IEventResponseVolunteer {
        const kInterfaceName = 'IEventResponseVolunteer';

        if (!validateArray(volunteer, kInterfaceName, 'name'))
            return false;

        if (volunteer.name.length !== 2)
            return issueErrorAndReturnFalse(kInterfaceName, 'name', 'should have a length of 2');

        for (let index = 0; index < volunteer.name.length; ++index) {
            if (!validateNumber(volunteer.name, kInterfaceName + '.name', index))
                return false;
        }

        return validateString(volunteer, kInterfaceName, 'identifier') &&
               validateOptionalString(volunteer, kInterfaceName, 'avatar');
    }

    /**
     * Returns the cache key specific to the given |identifier|. This method has been left public
     * for testing purposes, but otherwise should not be used outside of this class.
     */
    static cacheKeyForIdentifier(identifier: string): string {
        return EventFactory.kCacheKeyPrefix + identifier;
    }
}
