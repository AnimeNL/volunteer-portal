// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { del as kvDelete, get as kvGet, set as kvSet } from 'idb-keyval';

import type { IAuthRequest } from '../api/IAuth';

import { Cache } from './Cache';
import { CachedLoader } from './CachedLoader';
import { Configuration } from './Configuration';
import { IUserResponseEventRole, IUserResponse } from '../api/IUser';
import { IApplicationResponse, IApplicationRequest } from '../api/IApplication';
import { User } from './User';

import { validateObject, validateOptionalBoolean, validateOptionalString,
         validateString } from './TypeValidators';

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

    private configuration: Configuration;
    private loader: CachedLoader;

    private userAccessCode?: string;
    private userAuthToken?: string;
    private userEmailAddress?: string;
    private userEvents?: Map<string, IUserResponseEventRole>;
    private userResponse?: IUserResponse;

    private uploadedAvatarUrl?: string;

    constructor(configuration: Configuration) {
        this.configuration = configuration;
        this.loader = new CachedLoader(new Cache());
    }

    // Initializes the user interface. This is an operation that cannot fail: either we are able to
    // initialize the user state, which means that the user is authenticated, or we cannot, which
    // means that the user is not authenticated. State will be cached for a server-defined period.
    async initialize(accessCode?: string,
                     authToken?: string,
                     authTokenExpiration?: number,
                     emailAddress?: string): Promise<boolean> {
        if (!accessCode || !authToken) {
            const cachedToken = await kvGet(UserImpl.kAuthCacheKey);
            if (!cachedToken || hasExpired(cachedToken.authTokenExpiration))
                return false;

            accessCode = cachedToken.accessCode;
            authToken = cachedToken.authToken;
            authTokenExpiration = cachedToken.authTokenExpiration;
            emailAddress = cachedToken.emailAddress;
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

        this.userAccessCode = accessCode;
        this.userAuthToken = authToken;
        this.userEmailAddress = emailAddress;
        this.userEvents = new Map(Object.entries(userResponse.events));
        this.userResponse = userResponse;

        return true;
    }

    /**
     * Authenticates the user based on the given credentials. Returns a promise that will resolve
     * with a boolean indicating whether the authentication has succeeded.
     */
    async authenticate(request: IAuthRequest): Promise<boolean> {
        let authToken: string | undefined;
        let authTokenExpiration: number | undefined;

        const { emailAddress, accessCode } = request;

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

        return this.initialize(accessCode, authToken, authTokenExpiration, emailAddress).then(async success => {
            await kvSet(UserImpl.kAuthCacheKey, {
                accessCode,
                authToken,
                authTokenExpiration,
                emailAddress,
            });

            return success;
        });
    }

    /**
     * Submits the given |application| to the server. No caching can be applied, and availability of
     * network connectivity is a requirement.
     */
    async submitApplication(eventIdentifier: string, application: IApplicationRequest) {
        let applicationResponse: IApplicationResponse | undefined;

        try {
            const requestData = new FormData();

            requestData.set('event', eventIdentifier);
            for (const [ key, value ] of Object.entries(application))
                requestData.set(key, value);

            const response = await fetch(this.configuration.getApplicationEndpoint(), {
                method: 'POST',
                body: requestData,
            });

            if (!response.ok)
                return 'Unable to connect to the server: are you connected to the internet?';

            const responseData = await response.json();
            if (!this.validateApplicationResponse(responseData))
                throw new Error('Invalid data received from the application endpoint.');

            applicationResponse = responseData;

        } catch (exception) {
            console.error('Unable to interact with the application API:', exception);
            return 'There is an issue with the server, your application could not be shared.';
        }

        if (applicationResponse.error)
            return applicationResponse.error;

        if (!await this.authenticate({ emailAddress: application.emailAddress, accessCode: applicationResponse.accessCode! }))
            return 'Your application has been shared, but there is an issue with the server.';

        return null;  // all good
    }

    /**
     * Signs the user out of their account. Will remove all current and cached data.
     */
    async signOut() {
        if (!this.authenticated)
            return;  // the user isn't currently signed in

        await kvDelete(UserImpl.kAuthCacheKey);
        await kvDelete(UserImpl.kUserCacheKey);

        this.userAuthToken = undefined;
        this.userEvents = undefined;
        this.userResponse = undefined;
    }

    /**
     * Validates whether the given |response| adheres to the structure and format expected from
     * the IApplicationRequest format. Error messages will be sent to the console's error buffer if
     * the data could not be verified.
     */
    validateApplicationResponse(response: any): response is IApplicationResponse {
        const kInterfaceName = 'IApplicationResponse';

        if (typeof response !== 'object')
            return false;

        return response.hasOwnProperty('accessCode')
            ? validateString(response, kInterfaceName, 'accessCode')
            : validateString(response, kInterfaceName, 'error');
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

        return validateOptionalBoolean(userResponse, kInterfaceName, 'administrator') &&
               validateOptionalString(userResponse, kInterfaceName, 'avatar') &&
               validateString(userResponse, kInterfaceName, 'name');
    }

    // ---------------------------------------------------------------------------------------------
    // User interface implementation
    // ---------------------------------------------------------------------------------------------

    get authenticated(): boolean {
        return this.userResponse !== undefined;
    }

    get accessCode(): Readonly<string> {
        if (!this.userAccessCode)
            throw new Error(kExceptionMessage);

        return this.userAccessCode;
    }

    get authToken(): Readonly<string> {
        if (!this.userAuthToken)
            throw new Error(kExceptionMessage);

        return this.userAuthToken;
    }

    get avatar(): string | undefined {
        if (!this.userResponse)
            throw new Error(kExceptionMessage);

        return this.uploadedAvatarUrl ?? this.userResponse.avatar;
    }

    set avatar(url: string | undefined) {
        if (!this.userResponse)
            throw new Error(kExceptionMessage);

        this.uploadedAvatarUrl = url;
    }

    get emailAddress(): Readonly<string> {
        if (!this.userEmailAddress)
            throw new Error(kExceptionMessage);

        return this.userEmailAddress;
    }

    get events(): ReadonlyMap<string, IUserResponseEventRole> {
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
