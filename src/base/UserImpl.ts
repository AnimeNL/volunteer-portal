// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { Cache } from './Cache';
import { Configuration } from './Configuration';
import { User } from './User';

/**
 * Returns whether the given |authTokenExpiration| details a date in the past.
 */
function hasExpired(authTokenExpiration?: number): boolean {
    return !!authTokenExpiration && authTokenExpiration < Math.floor(Date.now() / 1000);
}

/**
 * Message to include with the exception thrown when user data is accessed without the current user
 * having authenticated to their account.
 */
const kExceptionMessage = 'The user has not authenticated to their account yet.';

/**
 * Implements the user state for the application. It's not required for people to be logged in while
 * using it, but being authenticated provides access to real-time registration updates and the
 * volunteer's personal schedule. This class implements the //api/auth behaviour.
 */
export class UserImpl implements User {
    private cache: Cache;
    private configuration: Configuration;

    private user?: any;

    constructor(cache: Cache, configuration: Configuration) {
        this.cache = cache;
        this.configuration = configuration;
    }

    // Initializes the user interface. This is an operation that cannot fail: either we are able to
    // initialize the user state, which means that the user is authenticated, or we cannot, which
    // means that the user is not authenticated. State will be cached for a server-defined period.
    async initialize(authToken?: string, authTokenExpiration?: number): Promise<boolean> {
        if (!authToken) {
            const cachedToken = await this.cache.get('portal-auth', /* allowUndefined= */ true);
            if (!cachedToken || hasExpired(cachedToken.authTokenExpiration))
                return false;

            authToken = cachedToken.authToken;
            authTokenExpiration = cachedToken.authTokenExpiration;
        }

        // load user information
        return false;
    }

    /**
     * Authenticates the user based on the given credentials. Returns a promise that will resolve
     * with a boolean indicating whether the authentication has succeeded.
     */
    async authenticate(emailAddress: string, accessCode: string): Promise<boolean> {
        let authToken: string | undefined;
        let authTokenExpiration: number | undefined;

        try {
            const requestData = new FormData();
            requestData.set('emailAddress', emailAddress);
            requestData.set('accessCode', accessCode);

            const response = await fetch(this.configuration.getAuthenticationEndpoint(), {
                method: 'POST',
                body: requestData,
            });

            const responseData = await response.json();
            if (typeof responseData !== 'object' || responseData === null)
                throw new Error('Invalid data received from the authentication endpoint.');

            if (responseData.hasOwnProperty('authToken')) {
                if (typeof responseData.authToken === 'string')
                    authToken = responseData.authToken as string;

                if (responseData.hasOwnProperty('authTokenExpiration') &&
                        typeof responseData.authTokenExpiration === 'number') {
                    authTokenExpiration = responseData.authTokenExpiration as number;
                }
            }
        } catch (exception) {
            console.error('Unable to interact with the authentication API:', exception);
            return false;
        }

        if (!authToken || hasExpired(authTokenExpiration))
            return false;  // the server was not able to issue a token

        return this.initialize(authToken, authTokenExpiration).then(async success => {
            await this.cache.set('portal-auth', { authToken, authTokenExpiration });
            return success;
        });
    }

    // ---------------------------------------------------------------------------------------------
    // User interface implementation
    // ---------------------------------------------------------------------------------------------

    get authenticated(): boolean {
        return this.user !== undefined;
    }

    get authToken(): Readonly<string> {
        if (!this.user)
            throw new Error(kExceptionMessage);

        return this.user.authToken;
    }

    get avatar(): Readonly<string | undefined> {
        if (!this.user)
            throw new Error(kExceptionMessage);

        return this.user.avatar;
    }

    get name(): Readonly<string> {
        if (!this.user)
            throw new Error(kExceptionMessage);

        return this.user.name;
    }
}
