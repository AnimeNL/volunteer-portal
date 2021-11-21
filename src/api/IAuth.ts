// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

/**
 * The /api/auth endpoint allows volunteers to identify themselves. When identified, the volunteer
 * portal will personalise for the signed in volunteer, showing content specific to them (e.g. their
 * registration status) and granting access to their personal schedule.
 */
export interface IAuth {
    request: IAuthRequest;
    response: IAuthResponse;
}

/**
 * Request issued to the server when making an /api/auth call. These variables will be shared with
 * the server as an HTTP POST request.
 */
export interface IAuthRequest {
    /**
     * The volunteer's e-mail address, which acts as their username.
     */
    emailAddress: string;

    /**
     * The volunteer's access code, which acts as their password.
     */
    accessCode: string;
}

/**
 * Response shared by the server following an /api/auth call. When successful, both the `authToken`
 * and `authTokenExpiration` properties will be present, otherwise the response will be empty.
 */
export interface IAuthResponse {
    /**
     * The volunteer's authentication token, iff their authentication request was successful.
     */
    authToken?: string;

    /**
     * A UNIX timestamp, in seconds, at which the volunteer's authentication token will expire. May
     * be omitted even when the volunteer's authentication request was successful. Expiration times
     * between January 1st, 2020 and January 1st, 2030 (GMT+0000) will be considered valid.
     *
     * @minimum 1577836800
     * @maximum 1893456000
     */
    authTokenExpiration?: number;
}
