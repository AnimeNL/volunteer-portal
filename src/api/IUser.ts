// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

/**
 * @see https://github.com/AnimeNL/volunteer-portal/blob/main/API.md#response-iuserresponse
 */
export interface IUserResponse {
    administrator?: boolean;
    avatar?: string;
    events: { [key: string]: EventRole };
    name: string;
}

/**
 * @see https://github.com/AnimeNL/volunteer-portal/blob/main/API.md#event-roles
 */
export type EventRole = 'Unregistered' | 'Registered' | 'Rejected' | string;
