// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { IAuthSuccessResponse } from '../api/IAuth';
import { User } from './User';

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
    private auth?: IAuthSuccessResponse;

    // ---------------------------------------------------------------------------------------------
    // User interface implementation
    // ---------------------------------------------------------------------------------------------

    get authenticated(): boolean {
        return this.auth !== undefined;
    }

    get authToken(): Readonly<string> {
        if (!this.auth)
            throw new Error(kExceptionMessage);

        return this.auth.authToken;
    }

    get avatar(): Readonly<string | undefined> {
        if (!this.auth)
            throw new Error(kExceptionMessage);

        return this.auth.avatar;
    }

    get name(): Readonly<string> {
        if (!this.auth)
            throw new Error(kExceptionMessage);

        return this.auth.name;
    }
}
