// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

/**
 * @see https://github.com/AnimeNL/volunteer-portal/blob/master/API.md#apienvironment
 */
export interface IEnvironment {
    eventName: string;
    portalTitle: string;
    seniorTitle: string;
    timezone: string;
    year: number;
}
