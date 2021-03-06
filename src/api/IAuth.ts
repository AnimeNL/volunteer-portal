// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

/**
 * @see https://github.com/AnimeNL/volunteer-portal/blob/main/API.md#request-iauthrequest
 */
export interface IAuthRequest {
    emailAddress: string;
    accessCode: string;
}

/**
 * @see https://github.com/AnimeNL/volunteer-portal/blob/main/API.md#response-iauthresponse
 */
export interface IAuthResponse {
    success: boolean;
}

export interface IAuthSuccessResponse extends IAuthResponse {
    authToken: string;
    authTokenExpiration?: number;
    avatar?: string;
    name: string;
}
