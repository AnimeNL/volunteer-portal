// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { EventRole } from '../api/IUser';

/**
 * The interface through which the user's state can be accessed. Certain properties may only be
 * considered when the user has authenticated to their account.
 */
export interface User {
    /**
     * Authenticates the user based on the given credentials. Returns a promise that will resolve
     * with a boolean indicating whether the authentication has succeeded.
     */
    authenticate(emailAddress: string, accessCode: string): Promise<boolean>;

    /**
     * Signs the user out of their account. Will remove all current and cached data.
     */
    signOut(): Promise<void>;

    /**
     * Whether the user has been authenticated to an account.
     */
    authenticated: boolean;

    /**
     * Authentication token that can be used to access otherwise privileged content.
     *
     * @throws Error when `authenticated` has not been set to TRUE.
     */
    authToken: Readonly<string>;

    /**
     * URL to the avatar representing the person who is authentication.
     *
     * @throws Error when `authenticated` has not been set to TRUE.
     */
    avatar: Readonly<string | undefined>;

    /**
     * Object containing the roles that the user has in various events. There are three predefined
     * values: { Unregistered, Registered, Rejected }. All other values represent the volunteer
     * having been accepted, where the value describes their role.
     *
     * @throws Error when `authenticated` has not been set to TRUE.
     */
    events: ReadonlyMap<string, EventRole>;

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
