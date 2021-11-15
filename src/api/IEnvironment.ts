// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

/**
 * Response structure for the /api/environment call. Describes the information associated with the
 * current "environment" the volunteer portal is running under, which is another way of explaining
 * the portal's branding. This allows a single installation to service multiple teams.
 */
export interface IEnvironmentResponse {
    title: string;

    themeColor: string;
    themeTitle: string;

    events: IEnvironmentResponseEvent[];

    contactName: string;
    contactTarget?: string;
}

/**
 * @see https://github.com/AnimeNL/volunteer-portal/blob/master/API.md#apienvironment
 */
export interface IEnvironmentResponseEvent {
    name: string;
    enableContent: boolean;
    enableRegistration: boolean;
    enableSchedule: boolean;
    identifier: string;
    timezone: string;
    website?: string;
}
