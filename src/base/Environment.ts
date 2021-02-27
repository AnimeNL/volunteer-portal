// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

/**
 * Defines the Environment object, which is the interface through which the results of the
 * IEnvironment API responses are exposed. All properties are immutable for users.
 */
export interface Environment {
    /**
     * Name of the person who can be contacted for questions.
     */
    contactName: Readonly<string>;

    /**
     * Phone number of the person who can be contacted for questions.
     */
    contactNumber?: Readonly<string>;

    /**
     * Array of the events that are supported by this portal.
     */
    events: Readonly<Array<EnvironmentEvent>>;

    /**
     * Name of the Volunteer Portal instance, e.g. _Volunteer Portal_.
     */
    title: Readonly<string>;
}

/**
 * Defines the EnvironmentEvent interface, through which the details about a particular event are
 * shared. This is a data-only object, implementing the IEnvironmentResponseEvent calls.
 */
export interface EnvironmentEvent {
    /**
     * Name of the event, e.g. _PortalCon 2021_.
     */
    name: Readonly<string>;

    /**
     * Whether the portal should be enabled for registered volunteers.
     */
    enablePortal: Readonly<boolean>;

    /**
     * Whether volunteer registrations should be accepted.
     */
    enableRegistration: Readonly<boolean>;

    /**
     * Timezone in which the event takes place, e.g. _Europe/London_.
     * @see https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
     */
    timezone: Readonly<string>;

    /**
     * URL to the website of the broader event.
     */
    website?: Readonly<string>;
}
