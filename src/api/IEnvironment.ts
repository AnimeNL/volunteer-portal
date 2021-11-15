// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

/**
 * The /api/environment call shares information associated with the current "environment" of the
 * volunteer portal, which can be thought of as its branding. This is a convenient mechanism that
 * allows multiple instances of the volunteer portal to run on a single installation.
 */
export interface IEnvironment {
    response: IEnvironmentResponse;
}

/**
 * Response shared by the server following an /api/environment call.
 *
 * @additionalProperties true
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
