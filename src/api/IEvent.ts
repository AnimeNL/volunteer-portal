// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

/**
 * Response structure for the /api/event endpoint.
 */
export interface IEventResponse {
    // Zero or more areas that are available for this event. Will be displayed in the menu.
    areas: IEventResponseArea[];

    // Zero or more events that will be taking place during this event.
    events: IEventResponseEvent[];

    // Zero or more locations in which events will be taking place.
    locations: IEventResponseLocation[];

    // Meta-information for this particular event. Must be given.
    meta: IEventResponseMeta;

    // Zero or more volunteers who will be active during this event.
    volunteers: IEventResponseVolunteer[];
}

/**
 * Structure defining an area of the event's venue.
 */
export interface IEventResponseArea {
    identifier: string;
    name: string;
    icon?: string;
}

/**
 * Structure defining an event part of the event's programme.
 */
export interface IEventResponseEvent {
    hidden: boolean;
    identifier: string;
    sessions: IEventResponseSession[];
}

/**
 * Structure defining a location within an area of the event's venue.
 */
export interface IEventResponseLocation {
    identifier: string;

    name: string;
    area: string;
}

/**
 * Structure defining the available meta-information supplied for an event.
 */
export interface IEventResponseMeta {
    name: string;
    timezone?: string;
}

/**
 * Structure defining one of the sessions that will be hosted during one of the events.
 */
export interface IEventResponseSession {
    location: string;

    name: string;
    description?: string;

    time: [ number, number ];
}

/**
 * Structure defining a volunteer who will be active during the event.
 */
export interface IEventResponseVolunteer {
    identifier: string;

    name: [ string, string ];
    environments: string[];

    accessCode?: string;
    avatar?: string;
    phoneNumber?: string;
}
