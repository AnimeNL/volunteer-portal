// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

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
    private configuration: Configuration;
    private data?: IEnvironmentResponse;

    /**
     * Name of the session storage cache in which the environment data will be recorded.
     */
    public static kCacheName: string = 'portal-environment';

    constructor(configuration: Configuration) {
        this.configuration = configuration;
    }

    /**
     * Initializes the environment by loading the configuration from the Environment API. The data
     * will first be attempted to be read from session storage to avoid hitting the network, after
     * which it will be loaded from the server.
     */
    async initialize(): Promise<boolean> {
        const kErrorPrefix = 'Unable to fetch the environment data: ';

        try {
            if (navigator.cookieEnabled) {
                const cachedInput = sessionStorage.getItem(EnvironmentImpl.kCacheName);
                if (cachedInput && this.initializeFromUnverifiedSource(kErrorPrefix, cachedInput))
                    return true;
            }

            const result = await fetch(this.configuration.getEnvironmentEndpoint());
            if (!result.ok) {
                console.error(kErrorPrefix + ` status ${result.status}`);
                return false;
            }

            if (!this.initializeFromUnverifiedSource(kErrorPrefix, await result.text()))
                return false;
            
            if (navigator.cookieEnabled)
                sessionStorage.setItem(EnvironmentImpl.kCacheName, JSON.stringify(this.data));

            return true;

        } catch (exception) {
            console.error(kErrorPrefix, exception);
        }

        return false;
    }

    /**
     * Attempts to initialize the environment based on the given |unverifiedInput| string. It is
     * expected to be in a JSON format, conforming to the definition of IEnvironmentResponse.
     */
    initializeFromUnverifiedSource(errorPrefix: string, unverifiedInput: string): boolean {
        try {
            const unverifiedEnvironment = JSON.parse(unverifiedInput);
            if (!this.validateEnvironmentResponse(unverifiedEnvironment))
                return false;

            this.data = unverifiedEnvironment;
            return true;

        } catch (exception) {
            console.error(errorPrefix, exception);
        }

        return false;
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
