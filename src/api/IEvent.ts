// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

/**
 * The /api/event API call enables an authenticated volunteer to retrieve information about a
 * particular event, including the meta-information, locations and volunteers that participate in
 * it. This API call requires request data, that will be shared with the server through the URL.
 */
export interface IEvent {
    request: IEventRequest;
    response: IEventResponse;
}

/**
 * Request issued to the server when making an /api/event call. These variables will be shared with
 * the server as an HTTP GET request.
 */
export interface IEventRequest {
    /**
     * Unique authentication token issued by the authentication API to this volunteer.
     */
    authToken: string;

    /**
     * Identifier for the event for which information is being requested, given by the environment.
     */
    event: string;
}

/**
 * Response shared by the server following an /api/event call. All information in the response, with
 * the exception of the meta-information, is considered optional.
 */
export interface IEventResponse {
    /**
     * Zero or more areas in which each of the locations are divided. These could be floors, larger
     * event spaces, or even individual buildings, and will be used to optimise navigation.
     */
    areas: IEventResponseArea[];

    /**
     * Zero or more events that will be taking place during this event. Each event has an associated
     * location in the venue.
     */
    events: IEventResponseEvent[];

    /**
     * Zero or more locations in the venue, usually representing individual rooms or strategic
     * points that tell visitors and volunteers alike about where they have to go.
     */
    locations: IEventResponseLocation[];

    /**
     * Meta-information about this particular event. Required.
     */
    meta: IEventResponseMeta;

    /**
     * Zero or more volunteers who will be helping out during this event. It's possible that one of
     * the volunteers represents the user who is logged in to the portal.
     */
    volunteers: IEventResponseVolunteer[];

    // TODO: `shifts`
}

/**
 * Structure defining an area of the event's venue.
 */
export interface IEventResponseArea {
    /**
     * Unique identifier for the area, which should be safe to use in a URL.
     */
    identifier: string;

    /**
     * Name of the area, as it should be represented in the user interface.
     */
    name: string;

    /**
     * Icon of the area, if applicable. The icon will be displayed in the user interface to further
     * specialize display of information where applicable.
     */
    icon?: string;
}

/**
 * Structure defining an event part of the event's programme.
 */
export interface IEventResponseEvent {
    /**
     * Unique identifier for the event, which should be safe to use in a URL.
     */
    identifier: string;

    /**
     * Boolean indicating whether this event should be hidden, which means that regular visitors do
     * not have the ability to see it on their schedules. It will be visible for volunteers when
     * returned by the /api/event API, but will be visually marked to represent its hiddenness.
     */
    hidden: boolean;

    /**
     * Notes that include an additional description or information specific to this event. The
     * |notes| can be written using Markdown. Certain volunteers have the ability to amend notes.
     */
    notes?: string;

    /**
     * One or more sessions during which this event will be taking place. Individual sessions can be
     * hosted in different locations, and, in some cases, may even have different names.
     *
     * @minimum 1
     */
    sessions: IEventResponseSession[];
}

/**
 * Structure defining a location within an area of the event's venue.
 */
export interface IEventResponseLocation {
    /**
     * Unique identifier for the location, which should be safe to use in a URL.
     */
    identifier: string;

    /**
     * Name of the location, which will be used in the user interface.
     */
    name: string;

    /**
     * Identifier for the area in which this location is located.
     *
     * @todo Should this be optional?
     */
    area: string;
}

/**
 * Structure defining the available meta-information supplied for an event.
 */
export interface IEventResponseMeta {
    /**
     * Name of the event, which will be used in the user interface.
     */
    name: string;

    /**
     * Timezone during which the event will be taking place. This has to be one of the timezone
     * identifiers used in the version of the Timezone Database used by the data library that the
     * volunteer portal depends on.
     *
     * @todo Remove the `timezone` from the `IEnvironmentResponseEvent` structure.
     */
    timezone?: string;
}

/**
 * Structure defining one of the sessions that will be hosted during one of the events.
 */
export interface IEventResponseSession {
    /**
     * Identifier for the location in which this session will be taking place.
     */
    location: string;

    /**
     * Name of the session, which will be used in the user interface.
     */
    name: string;

    /**
     * Description of this session. This will be used in the user interface, and can either be the
     * text used for this session, but perhaps more interestingly, instructions for volunteers who
     * have shifts scheduled during this session.
     */
    description?: string;

    /**
     * The time ([ startTime, endTime ]) during which this session will be taking place.
     *
     * @todo Should we have a type representing time, also for time modifications, to enable some
     *       form of automatic mapping by TypeScript from the API response types? (Yes.)
     */
    time: [ number, number ];
}

/**
 * Structure defining a volunteer who will be active during the event.
 */
export interface IEventResponseVolunteer {
    /**
     * Unique identifier for the volunteer, which should be safe to use in a URL.
     */
    identifier: string;

    /**
     * The name of the volunteer, as ([ firstName, lastName ]). The user interface may only use a
     * volunteer's first name to make text appear more friendly, as well as aid conciseness.
     */
    name: [ string, string ];

    /**
     * Environments in which this volunteer holds a position, together with their role.
     */
    environments: Record</* name= */ string, /* role= */ string>;

    /**
     * This volunteer's access code. The server is expected to only share this information with
     * administrators, who may have to help people access their accounts.
     */
    accessCode?: string;

    /**
     * This volunteer's avatar, as a fully qualified URL. Their avatar helps the volunteer be
     * recognizable, particularly helpful when there are hundreds of volunteers at the event.
     */
    avatar?: string;

    /**
     * Notes that include an additional description or information specific to this volunteer. The
     * |notes| can be written using Markdown. Certain volunteers have the ability to amend notes.
     */
    notes?: string;

    /**
     * This volunteer's phone number. The server is expected to only share someone's phone number
     * when they are either a consenting senior, or when the authenticated user has a strong reason
     * to be able to access this information - for example because *they* are a senior.
     */
    phoneNumber?: string;
}
