// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

/**
 * Defines the Environment object, which is the interface through which the results of the
 * IEnvironment API responses are exposed. All properties are immutable for users.
 */
export interface Environment {
    /**
     * Name of the Volunteer Portal instance, e.g. _Volunteer Portal_.
     */
    title: Readonly<string>;

    /**
     * HTML colour that defines the base theme for the current portal.
     */
    themeColor: Readonly<string>;

    /**
     * Title of the theme, as it should be displayed in logos.
     */
    themeTitle: Readonly<string>;

    /**
     * Array of the events that are supported by this portal.
     */
    events: ReadonlyArray<EnvironmentEvent>;

    /**
     * Name of the person who can be contacted for questions.
     */
    contactName: Readonly<string>;

    /**
     * Link target (phone number / e-mail address) of the person who can be contacted for questions.
     */
    contactTarget?: Readonly<string>;
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
     * Whether content pages for this event should be enabled.
     */
    enableContent: Readonly<boolean>;

    /**
     * Whether volunteer registrations should be accepted for this event.
     */
    enableRegistration: Readonly<boolean>;

    /**
     * Whether access to the schedule should be enabled for this event.
     */
    enableSchedule: Readonly<boolean>;

    /**
     * URL-safe representation of the event's name, e.g. _portalcon-2021_.
     */
    identifier: Readonly<string>;

    /**
     * URL to the website of the broader event.
     */
    website?: Readonly<string>;
}
