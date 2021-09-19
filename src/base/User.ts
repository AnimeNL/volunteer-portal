// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { EventRole } from '../api/IUser';
import { IApplicationRequest } from '../api/IApplication';

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
     * Submits an application for participation within a certain event. This method will not return
     * when the application was submitted successfully. In case of an error, the returned string
     * will be appropriate to be presented to the user.
     */
    submitApplication(eventIdentifier: string,
                      application: IApplicationRequest): Promise<string>;

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
     * URL to the avatar representing the person who is authentication.
     *
     * @throws Error when `authenticated` has not been set to TRUE.
     */
    avatar: Readonly<string | undefined>;

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
