// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { Cache } from './Cache';
import { CachedLoader } from './CachedLoader';
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
    public static kCacheKey: string = 'portal-environment';

    private configuration: Configuration;
    private loader: CachedLoader;

    private data?: IEnvironmentResponse;

    constructor(cache: Cache, configuration: Configuration) {
        this.configuration = configuration;
        this.loader = new CachedLoader(cache);
    }

    /**
     * Initializes the environment by loading the configuration from the Environment API. The data
     * will first be attempted to be read from session storage to avoid hitting the network, after
     * which it will be loaded from the server.
     */
    async initialize(): Promise<boolean> {
        const environment = await this.loader.initialize({
            cacheKey: EnvironmentImpl.kCacheKey,
            url: this.configuration.getEnvironmentEndpoint(),
            validationFn: EnvironmentImpl.prototype.validateEnvironmentResponse.bind(this),
        });

        if (!environment)
            return false;

        this.data = environment;
        return true;
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
