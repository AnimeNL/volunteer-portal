// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { del as kvDelete, get as kvGet, set as kvSet } from 'idb-keyval';

import { ApiRequest } from './ApiRequest';
import { ApiRequestManager, ApiRequestObserver } from './ApiRequestManager';

import type { IApplicationRequest } from '../api/IApplication';
import type { IAuthRequest } from '../api/IAuth';
import type { IUserResponseEventRole, IUserResponse } from '../api/IUser';
import type { Invalidatable } from './Invalidatable';
import type { User } from './User';

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
 * Interface describing the authentication information as it can be cached for continuous state
 * throughout multiple portal sessions.
 */
interface AuthenticationCache {
    accessCode: string;
    authToken: string;
    authTokenExpiration?: number;
    emailAddress: string;
}

/**
 * Implements the user state for the application. It's not required for people to be logged in while
 * using it, but being authenticated provides access to real-time registration updates and the
 * volunteer's personal schedule. This class implements the //api/auth behaviour.
 */
export class UserImpl implements ApiRequestObserver<'IUser'>, User {
    public static kAuthCacheKey: string = 'portal-auth';

    private requestManager: ApiRequestManager<'IUser'>;
    private requestToken?: AuthenticationCache;
    private response?: IUserResponse;
    private uploadedAvatarUrl?: string;

    private observer?: Invalidatable;

    constructor(observer?: Invalidatable) {
        this.requestManager = new ApiRequestManager('IUser', this);
        this.observer = observer;
    }

    /**
     * Initializes the content by issuing an API call request, and returns when that request has
     * been completed successfully. The initial content may be sourced from the local cache.
     */
     async initialize(token?: AuthenticationCache): Promise<boolean> {
        // TODO: (Re)authentication failures should remove the cached token, so that subsequent
        // loads will not attempt to use the cached information to resume the session.

        token ??= await kvGet<AuthenticationCache>(UserImpl.kAuthCacheKey);
        if (!token || hasExpired(token.authTokenExpiration))
            return true;  // the user won't be signed in

        const result = await this.requestManager.issue({ authToken: token.authToken });
        if (!result || !this.response)
            return result;  // the user won't be signed in

        this.requestToken = token;
        return true;
    }

    /**
     * Authenticates the user based on the given credentials. Returns a promise that will resolve
     * with a boolean indicating whether the authentication has succeeded.
     */
    async authenticate(request: IAuthRequest): Promise<boolean> {
        try {
            const apiRequest = new ApiRequest('IAuth');
            const apiResponse = await apiRequest.issue(request);

            if (!apiResponse.authToken || hasExpired(apiResponse.authTokenExpiration))
                return false;

            const token: AuthenticationCache = {
                authToken: apiResponse.authToken,
                authTokenExpiration: apiResponse.authTokenExpiration,
                ...request,
            };

            if (!await this.initialize(token) || !this.authenticated)
                return false;

            await kvSet(UserImpl.kAuthCacheKey, token);
            return true;

        } catch (exception) {
            console.error('Unable to interact with the authentication API:', exception);
        }

        return false;
    }

    /**
     * Submits the given |application| to the server. No caching can be applied, and availability of
     * network connectivity is a requirement. When the application was submitted successfully, the
     * user will automatically be signed in to their account.
     */
    async submitApplication(application: IApplicationRequest): Promise<string | null> {
        let accessCode: string | undefined;

        try {
            const apiRequest = new ApiRequest('IApplication');
            const apiResponse = await apiRequest.issue(application);

            if (apiResponse.error)
                return apiResponse.error;

            accessCode = apiResponse.accessCode;

        } catch (exception) {
            console.error('Unable to interact with the application API:', exception);
            return 'There is an issue with the server, your application could not be shared.';
        }

        if (!accessCode)
            return 'Your application has been shared, but you were not automatically signed in.';

        if (!await this.authenticate({ emailAddress: application.emailAddress, accessCode }))
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

        this.requestToken = undefined;
        this.response = undefined;
        this.uploadedAvatarUrl = undefined;
    }

    // ---------------------------------------------------------------------------------------------
    // ApiRequestObserver interface implementation
    // ---------------------------------------------------------------------------------------------

    onFailedResponse(error: Error) { /* handled in the App */ }
    onSuccessResponse(response: IUserResponse) {
        this.response = response;

        if (this.observer)
            this.observer.invalidate();
    }

    // ---------------------------------------------------------------------------------------------
    // User interface implementation
    // ---------------------------------------------------------------------------------------------

    get authenticated(): boolean {
        return this.response !== undefined;
    }

    get accessCode(): Readonly<string> {
        if (!this.requestToken)
            throw new Error(kExceptionMessage);

        return this.requestToken.accessCode;
    }

    get authToken(): Readonly<string> {
        if (!this.requestToken)
            throw new Error(kExceptionMessage);

        return this.requestToken.authToken;
    }

    get avatar(): string | undefined {
        if (!this.response)
            throw new Error(kExceptionMessage);

        return this.uploadedAvatarUrl ?? this.response.avatar;
    }

    set avatar(url: string | undefined) {
        if (!this.response)
            throw new Error(kExceptionMessage);

        this.uploadedAvatarUrl = url;
    }

    get emailAddress(): Readonly<string> {
        if (!this.requestToken)
            throw new Error(kExceptionMessage);

        return this.requestToken.emailAddress;
    }

    get events(): ReadonlyMap<string, IUserResponseEventRole> {
        if (!this.response)
            throw new Error(kExceptionMessage);

        return new Map(Object.entries(this.response.events));
    }

    isAdministrator(): boolean {
        if (!this.response)
            throw new Error(kExceptionMessage);

        return !!this.response.administrator;
    }

    get name(): Readonly<string> {
        if (!this.response)
            throw new Error(kExceptionMessage);

        return this.response.name;
    }
}
