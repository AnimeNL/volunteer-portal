// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { Cache } from './Cache';
import { Configuration } from './Configuration';
import { Environment, EnvironmentEvent } from './Environment';
import { IEnvironmentResponse, IEnvironmentResponseEvent } from '../api/IEnvironment';

import { validateArray, validateBoolean, validateOptionalString, validateString } from './TypeValidators';

/**
 * Message to include with the exception thrown when data is being accessed before the Environment
 * has been initialized properly.
 */
const kExceptionMessage = 'The Environment object has not been successfully initialized yet.';

/**
 * Implementation of the Environment interface, shared across the entire Volunteer Portal.
 */
export class EnvironmentImpl implements Environment {
    private cache: Cache;
    private configuration: Configuration;
    private data?: IEnvironmentResponse;

    /**
     * Name of the session storage cache in which the environment data will be recorded.
     */
    public static kCacheKey: string = 'portal-environment';

    constructor(cache: Cache, configuration: Configuration) {
        this.cache = cache;
        this.configuration = configuration;
    }

    /**
     * Initializes the environment by loading the configuration from the Environment API. The data
     * will first be attempted to be read from session storage to avoid hitting the network, after
     * which it will be loaded from the server.
     */
    async initialize(): Promise<boolean> {
        return Promise.any([
            // (1) Initialize the environment from the cache, when available. This will finish first
            // when the cache has been populated, so be careful not to override existing data.
            this.initializeFromCache().then(environment => {
                if (!this.data)
                    this.data = environment;

                return true;
            }),

            // (2) Initialize the environment from the network, when possible. Will override the
            // cached version, but will likely take more time to become available.
            this.initializeFromNetwork().then(async environment => {
                // (a) Store the obtained |environment| information in the cache. This gives us
                //     stale-while-revalidate behaviour already.
                await this.cache.set(EnvironmentImpl.kCacheKey, environment);

                // (b) Activate the obtained |environment| data for the current session.
                // TODO: Should we force a refresh of the page if it changed from the cached value?
                this.data = environment;
                return true;
            }),

        // (3) If both fail, then we're offline and don't have a cached variant. The application
        // requires the environment to be known, so consider this a fatal error.
        ]).catch(aggregateException => false);
    }

    /**
     * Initializes environment information from the cache. As long as it's been cached once, this
     * will continue to work even without network connectivity.
     */
    async initializeFromCache(): Promise<IEnvironmentResponse> {
        const environment = await this.cache.get(EnvironmentImpl.kCacheKey);

        if (!this.validateEnvironmentResponse(environment)) {
            await this.cache.delete(EnvironmentImpl.kCacheKey);
            throw new Error(`Cannot validate environment data stored in the cache.`);
        }

        return environment;
    }

    /**
     * Initializes environment information from the network. This will most likely take longer to
     * load than cached information (when it exists), but has the ability to update it.
     */
    async initializeFromNetwork(): Promise<IEnvironmentResponse> {
        const response = await fetch(this.configuration.getEnvironmentEndpoint());
        if (!response.ok)
            throw new Error(`Cannot fetch environment data from the server (${response.status}).`);

        const environment = await response.json();
        if (!this.validateEnvironmentResponse(environment))
            throw new Error(`Cannot validate environment data received from the server.`);

        return environment;
    }

    /**
     * Validates the given |environment| as data given in the IEnvironment response format. Error
     * messages will be sent to the console's error buffer if the data could not be verified.
     */
    validateEnvironmentResponse(environment: any): environment is IEnvironmentResponse {
        const kInterfaceName = 'IEnvironmentResponse';

        if (!validateArray(environment, kInterfaceName, 'events'))
            return false;

        for (const event of environment.events) {
            if (!this.validateEnvironmentResponseEvent(event))
                return false;
        }

        return validateString(environment, kInterfaceName, 'contactName') &&
               validateOptionalString(environment, kInterfaceName, 'contactTarget') &&
               validateString(environment, kInterfaceName, 'title');
    }

    /**
     * Validates whether the given |event| is a valid IEnvironmentResponseEvent structure. This data
     * will generally have been sourced from untrusted input, i.e. the network.
     */
    validateEnvironmentResponseEvent(event: any): event is IEnvironmentResponseEvent {
        const kInterfaceName = 'IEnvironmentResponseEvent';

        return validateString(event, kInterfaceName, 'name') &&
               validateBoolean(event, kInterfaceName, 'enablePortal') &&
               validateBoolean(event, kInterfaceName, 'enableReferences') &&
               validateBoolean(event, kInterfaceName, 'enableRegistration') &&
               validateString(event, kInterfaceName, 'slug') &&
               validateString(event, kInterfaceName, 'timezone') &&
               validateOptionalString(event, kInterfaceName, 'website');
    }

    // ---------------------------------------------------------------------------------------------
    // Environment interface implementation
    // ---------------------------------------------------------------------------------------------

    get contactName(): Readonly<string> {
        if (!this.data)
            throw new Error(kExceptionMessage);

        return this.data.contactName;
    }

    get contactTarget(): undefined | Readonly<string> {
        if (!this.data)
            throw new Error(kExceptionMessage);

        return this.data.contactTarget;
    }

    get events(): Readonly<Array<EnvironmentEvent>> {
        if (!this.data)
            throw new Error(kExceptionMessage);

        return this.data.events;
    }

    get title(): Readonly<string> {
        if (!this.data)
            throw new Error(kExceptionMessage);

        return this.data.title;
    }
}
