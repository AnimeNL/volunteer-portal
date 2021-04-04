// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

/**
 * @see https://github.com/AnimeNL/volunteer-portal/blob/master/API.md#apievent
 */
export interface IEventResponse {
    events: IEventResponseEvent[];
    locations: IEventResponseLocation[];
    volunteers: IEventResponseVolunteer[];
}

/**
 * @see https://github.com/AnimeNL/volunteer-portal/blob/master/API.md#response-ieventresponseevent
 */
export interface IEventResponseEvent {
    title: string;
    description: string;
    sessions: IEventResponseSession[];
}

/**
 * @see https://github.com/AnimeNL/volunteer-portal/blob/master/API.md#response-ieventresponselocation
 */
export interface IEventResponseLocation {
    name: string;
    area: string;
}

/**
 * @see https://github.com/AnimeNL/volunteer-portal/blob/master/API.md#response-ieventresponsesession
 */
export interface IEventResponseSession {
    location: string;
    time: [ number, number ];
}

/**
 * @see https://github.com/AnimeNL/volunteer-portal/blob/master/API.md#response-ieventresponsevolunteer
 */
export interface IEventResponseVolunteer {
    name: [ string, string ];
    identifier: string;
    avatar?: string;
}
