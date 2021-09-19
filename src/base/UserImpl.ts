// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { Cache } from './Cache';
import { CachedLoader } from './CachedLoader';
import { Configuration } from './Configuration';
import { EventRole, IUserResponse } from '../api/IUser';
import { User, UserApplication } from './User';

import { validateNumber, validateObject, validateOptionalBoolean, validateOptionalString, validateString } from './TypeValidators';

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
 * Interface available to objects that want to observe the UserImpl for state changes.
 */
export interface UserImplObserver {
    /**
     * Called when the authentication state has changed, ergo the user either signed in to their
     * account or signed out. This should generally request a full update.
     */
    onAuthenticationStateChanged(): void;
}

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
    private observers: Set<UserImplObserver>;

    private userAuthToken?: string;
    private userEvents?: Map<string, EventRole>;
    private userResponse?: IUserResponse;

    constructor(cache: Cache, configuration: Configuration) {
        this.cache = cache;
        this.configuration = configuration;
        this.loader = new CachedLoader(cache);
        this.observers = new Set();
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
        this.userEvents = new Map(Object.entries(userResponse.events));
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

            for (const observer of this.observers)
                observer.onAuthenticationStateChanged();

            return success;
        });
    }

    /**
     * Submits the given |application| to the server. No caching can be applied, and availability of
     * network connectivity is a requirement.
     */
    async submitApplication(application: UserApplication) {
        await new Promise(resolve => setTimeout(resolve, 2500));
        console.log(application);

        return { success: false, error: 'Not implemented' };
    }

    /**
     * Signs the user out of their account. Will remove all current and cached data.
     */
    async signOut() {
        if (!this.authenticated)
            return;  // the user isn't currently signed in

        await this.cache.delete(UserImpl.kAuthCacheKey);
        await this.cache.delete(UserImpl.kUserCacheKey);

        this.userAuthToken = undefined;
        this.userEvents = undefined;
        this.userResponse = undefined;

        for (const observer of this.observers)
            observer.onAuthenticationStateChanged();
    }

    /**
     * Validates the given |user| as data given in the IUserResponse response format. Error
     * messages will be sent to the console's error buffer if the data could not be verified.
     */
    validateUserResponse(userResponse: any): userResponse is IUserResponse {
        const kInterfaceName = 'IUserResponse';

        if (!validateObject(userResponse, kInterfaceName, 'events'))
            return false;

        for (const eventIdentifier of Object.keys(userResponse.events)) {
            if (!validateString(userResponse.events, `${kInterfaceName}[events]`, eventIdentifier))
                return false;
        }

        return validateNumber(userResponse, kInterfaceName, 'accessCode') &&
               validateOptionalBoolean(userResponse, kInterfaceName, 'administrator') &&
               validateOptionalString(userResponse, kInterfaceName, 'avatar') &&
               validateString(userResponse, kInterfaceName, 'emailAddress') &&
               validateString(userResponse, kInterfaceName, 'name');
    }

    // ---------------------------------------------------------------------------------------------
    // Observer management
    // ---------------------------------------------------------------------------------------------

    /**
     * Adds the given |observer| to the list of state observers. Safe to call multiple times.
     */
    addObserver(observer: UserImplObserver) {
        this.observers.add(observer);
    }

    /**
     * Removes the given |observer| from the list of state observers. Safe to call multiple times.
     */
    removeObserver(observer: UserImplObserver) {
        this.observers.delete(observer);
    }

    // ---------------------------------------------------------------------------------------------
    // User interface implementation
    // ---------------------------------------------------------------------------------------------

    get authenticated(): boolean {
        return this.userResponse !== undefined;
    }

    get accessCode(): Readonly<number> {
        if (!this.userResponse)
            throw new Error(kExceptionMessage);

        return this.userResponse.accessCode;
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

    get emailAddress(): Readonly<string> {
        if (!this.userResponse)
            throw new Error(kExceptionMessage);

        return this.userResponse.emailAddress;
    }

    get events(): ReadonlyMap<string, EventRole> {
        if (!this.userEvents)
            throw new Error(kExceptionMessage);

        return this.userEvents;
    }

    isAdministrator(): boolean {
        if (!this.userResponse)
            throw new Error(kExceptionMessage);

        return !!this.userResponse.administrator;
    }

    get name(): Readonly<string> {
        if (!this.userResponse)
            throw new Error(kExceptionMessage);

        return this.userResponse.name;
    }
}
