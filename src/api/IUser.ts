// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

/**
 * The /api/user API call enables information about the authenticated user to be requested, which
 * immediately validates that the given authentication token is still valid as well.
 */
 export interface IUser {
    request: IUserRequest;
    response: IUserResponse;
}

/**
 * Request issued to the server when making an /api/user call. The authentication token will be
 * shared with the server as an HTTP GET request parameter.
 */
export interface IUserRequest {
    /**
     * The authentication token through which the user is signed in.
     */
    authToken: string;
}

/**
 * Response shared by the server following an /api/user call. The user's full name and events they
 * participate in are required, other fields are optional.
 */
export interface IUserResponse {
    /**
     * Whether the authenticated user is an administrator. Additional functionality and visibility
     * will be enabled in the frontend, but only when the server provides the required information.
     */
    administrator?: boolean;

    /**
     * URL to the avatar that represents this user.
     */
    avatar?: string;

    /**
     * Dictionary of the events that this volunteer has a role in. The role has a series of fixed
     * values, other strings represent a visible position.
     */
    events: { [key: string]: IUserResponseEventRole };

    /**
     * The user's full name. User interface may opt to only display the user's first name.
     */
    name: string;
}

/**
 * The roles that a volunteer can have during an event.
 */
export type IUserResponseEventRole =
    'Unregistered' | 'Cancelled' | 'Registered' | 'Rejected' | string;
