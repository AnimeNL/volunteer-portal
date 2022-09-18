// Copyright 2022 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

/**
 * The /api/display call makes available information about the volunteers scheduled on a specific
 * shift, allowing it to be displayed on physical displays we distribute across the convention.
 */
export interface IDisplay {
    request: IDisplayRequest;
    response: IDisplayResponse;
}

/**
 * Request issued to the server when making an /api/display call.
 */
export interface IDisplayRequest {
    /**
     * The unique identifier associated with the display.
     */
    identifier: string;
}

/**
 * Response issued by the server when responding to an /api/display call. Can fail when the given
 * display identifier has not been configured.
 */
export interface IDisplayResponse {
    /**
     * The error message seen while requesting a display, if any.
     */
    error?: string;

    /**
     * Title that should be displayed on the display, always available for a successful response.
     */
    title?: string;

    /**
     * Shifts that should be displayed on the display, always available for a successful response.
     */
    shifts?: IDisplayResponseShift[];
}

/**
 * Information about a particular shift included in the /api/display response.
 */
export interface IDisplayResponseShift {
    /**
     * Name of the volunteer who will be working on this shift.
     */
    name: string;

    /**
     * URL to the avatar of the volunteer who will be working this shift, if any.
     */
    avatar?: string;

    /**
     * The role that this volunteer will be fulfilling during the shift.
     */
    role: string;

    /**
     * The time ([ startTime, endTime ]) during which this shift will be taking place.
     */
    time: [ number, number ];
}
