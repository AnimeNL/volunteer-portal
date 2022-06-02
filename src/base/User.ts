// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import type { IApplicationRequest } from '../api/IApplication';
import type { IAuthRequest } from '../api/IAuth';
import type { IUserResponseEventRole } from '../api/IUser';

/**
 * The interface through which the user's state can be accessed. Certain properties may only be
 * considered when the user has authenticated to their account.
 */
export interface User {
    /**
     * Authenticates the user based on the given credentials. Returns a promise that will resolve
     * with a boolean indicating whether the authentication has succeeded.
     */
    authenticate(request: IAuthRequest): Promise<boolean>;

    /**
     * Submits an application for participation within a certain event. This method will return a
     * string with a user-presentable error message in case of issues, or NULL when there were no
     * issues. The application will have been redirected if that were the case.
     */
    submitApplication(application: IApplicationRequest): Promise<string | null>;

    /**
     * Signs the user out of their account. Will remove all current and cached data.
     */
    signOut(): Promise<void>;

    /**
     * Whether the user has been authenticated to an account.
     */
    authenticated: boolean;

    /**
     * The access code through which the user is able to access the volunteer portal.
     *
     * @throws Error when `authenticated` has not been set to TRUE.
     */
    accessCode: Readonly<string>;

    /**
     * Authentication token that can be used to access otherwise privileged content.
     *
     * @throws Error when `authenticated` has not been set to TRUE.
     */
    authToken: Readonly<string>;

    /**
     * URL to the avatar representing the person who is authentication. This may be changed by the
     * application in case the user updates their own avatar.
     *
     * @throws Error when `authenticated` has not been set to TRUE.
     */
    avatar?: string;

    /**
     * The e-mail address that has been associated with the current access code.
     *
     * @throws Error when `authenticated` has not been set to TRUE.
     */
    emailAddress: Readonly<string>;

    /**
     * Object containing the roles that the user has in various events. There are three predefined
     * values: { Unregistered, Registered, Rejected }. All other values represent the volunteer
     * having been accepted, where the value describes their role.
     *
     * @throws Error when `authenticated` has not been set to TRUE.
     */
    events: ReadonlyMap<string, IUserResponseEventRole>;

    /**
     * Returns whether the user is a portal administrator, which adjusts the application's behaviour
     * in a number of scenarios. Requires that the user has been authenticated.
     *
     * @throws Error when `authenticated` has not been set to TRUE.
     */
    isAdministrator(): boolean;

    /**
     * Full name of the person who has authenticated to their account.
     *
     * @throws Error when `authenticated` has not been set to TRUE.
     */
    name: Readonly<string>;
}

/**
 * Returns whether the given |role| is one that indicates that the assignee has been accepted to an
 * event. The predefined roles that indicate application progress are excluded from this.
 */
export function isAcceptedEventRole(role: IUserResponseEventRole): boolean {
    switch (role) {
        case 'Cancelled':
        case 'Registered':
        case 'Rejected':
        case 'Unregistered':
            return false;
    }

    return true;
}
