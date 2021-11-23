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
    /**
     * Full name of this environment, including information about the relevant organisation.
     *
     * @example AnimeCon Steward Portal
     */
    title: string;

    /**
     * Colour in which the portal should be rendered. Colours used in logos, text and other visual
     * elements will be derived from this value.
     */
    themeColor: string;

    /**
     * Shortened name of the environment as it should be used in UI elements in which not all of the
     * `title` is relevant, for example the logo.
     *
     * @example Steward Team
     */
    themeTitle: string;

    /**
     * Zero or more events that should be made available to visitors of the ovlunteer portal. While
     * there (in practice) should always be a single event, no events will be handled gracefully.
     */
    events: IEnvironmentResponseEvent[];

    /**
     * Name of the person who can be contacted in case of issues.
     */
    contactName: string;

    /**
     * Destination to which the name of the contact should be listed. This can be anything to which
     * an <a> element can link, though "mailto:info@example.com" and "tel:+31612345678" are useful.
     */
    contactTarget?: string;
}

/**
 * Information concerning an individual event that's known to this environment, which influences how
 * the portal displays it on the portal—if at all.
 */
export interface IEnvironmentResponseEvent {
    /**
     * Unique textual identifier for the event. Used in URLs, as well as internal cross-references,
     * to distinguish or link information between different events.
     */
    identifier: string;

    /**
     * Name of the event. Used thoroughly throughout the user interface.
     */
    name: string;

    /**
     * Whether the registration portal for this event should be linked from the homepage.
     */
    enableContent: boolean;

    /**
     * Whether the registration portal for this event should be accepting registrations.
     */
    enableRegistration: boolean;

    /**
     * Whether the volunteer schedule for this event should be available.
     */
    enableSchedule: boolean;

    /**
     * Fully qualified URL of the main website for this event. Can be referred to in various ways,
     * although the canonical usage is on the main page when content is not yet available.
     */
    website?: string;
}
