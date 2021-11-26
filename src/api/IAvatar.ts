// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

/**
 * The /api/avatar endpoint allows volunteers and administrators to update the avatars displayed in
 * the volunteer portal. Access rights are validated on the client, but must be validated on the
 * server as well to prevent misuse.
 */
export interface IAvatar {
    request: IAvatarRequest;
    response: IAvatarResponse;
}

/**
 * Request issued to the server when making an /api/avatar call. The authentication token and event
 * will be shared as HTTP GET parameters, the rest as HTTP POST parameters.
 */
export interface IAvatarRequest {
    /**
     * The authentication token of the user who is making this upload request.
     */
    authToken: string;

    /**
     * The actual avatar information as it's being uploaded. The blob must contain an image that
     * has been encoded in image/png format, with no use of transparency.
     */
    avatar: Blob;

    /**
     * Unique identifier for the event for which this avatar is being uploaded.
     */
    event: string;

    /**
     * User token identifying the user whose avatar is being uploaded.
     */
    userToken: string;
}

/**
 * Response shared by the server following an /api/avatar call. No information will be returned when
 * the upload was successful, otherwise |error| will be populated with a message.
 */
export interface IAvatarResponse {
    /**
     * The error message seen while uploading an avatar, if any.
     */
    error?: string;
}
