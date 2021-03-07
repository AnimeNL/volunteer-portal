// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { Cache } from './Cache';
import { CachedLoader } from './CachedLoader';
import { Configuration } from './Configuration';
import { IUserResponse } from '../api/IUser';
import { User } from './User';

import { validateOptionalString, validateString } from './TypeValidators';

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
    public static kAuthCacheKey: string = 'portal-auth';
    public static kUserCacheKey: string = 'portal-user';

    private cache: Cache;
    private configuration: Configuration;
    private loader: CachedLoader;

    private userAuthToken?: string;
    private userResponse?: IUserResponse;

    constructor(cache: Cache, configuration: Configuration) {
        this.cache = cache;
        this.configuration = configuration;
        this.loader = new CachedLoader(cache);
    }

    // Initializes the user interface. This is an operation that cannot fail: either we are able to
    // initialize the user state, which means that the user is authenticated, or we cannot, which
    // means that the user is not authenticated. State will be cached for a server-defined period.
    async initialize(authToken?: string, authTokenExpiration?: number): Promise<boolean> {
        if (!authToken) {
            const cachedToken = await this.cache.get(UserImpl.kAuthCacheKey);
            if (!cachedToken || hasExpired(cachedToken.authTokenExpiration))
                return false;

            authToken = cachedToken.authToken;
            authTokenExpiration = cachedToken.authTokenExpiration;
        }

        if (!authToken)
            return false;  // no authentication token is available

        const userResponse = await this.loader.initialize({
            cacheKey: UserImpl.kUserCacheKey,
            url: this.configuration.getUserEndpoint(authToken),
            validationFn: UserImpl.prototype.validateUserResponse.bind(this),
        });

        if (!userResponse)
            return false;  // the response could not be verified per the appropriate structure

        this.userAuthToken = authToken;
        this.userResponse = userResponse;

        return true;
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

            if (!response.ok)
                return false;  // could not get a response from the API

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
            await this.cache.set(UserImpl.kAuthCacheKey, { authToken, authTokenExpiration });
            return success;
        });
    }

    /**
     * Validates the given |user| as data given in the IUserResponse response format. Error
     * messages will be sent to the console's error buffer if the data could not be verified.
     */
    validateUserResponse(userResponse: any): userResponse is IUserResponse {
        const kInterfaceName = 'IUserResponse';

        return validateOptionalString(userResponse, kInterfaceName, 'avatar') &&
               validateString(userResponse, kInterfaceName, 'name');
    }

    // ---------------------------------------------------------------------------------------------
    // User interface implementation
    // ---------------------------------------------------------------------------------------------

    get authenticated(): boolean {
        return this.userResponse !== undefined;
    }

    get authToken(): Readonly<string> {
        if (!this.userAuthToken)
            throw new Error(kExceptionMessage);

        return this.userAuthToken;
    }

    get avatar(): Readonly<string | undefined> {
        if (!this.userResponse)
            throw new Error(kExceptionMessage);

        return this.userResponse.avatar;
    }

    get name(): Readonly<string> {
        if (!this.userResponse)
            throw new Error(kExceptionMessage);

        return this.userResponse.name;
    }
}
