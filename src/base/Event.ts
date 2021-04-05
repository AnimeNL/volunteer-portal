// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import moment from 'moment-timezone';

/**
 * Interface that defines how code is expected to interact with information about a specific event.
 * This builds on top of the `IEventResponse` information retrieved from the Event API.
 */
export interface Event {
    /**
     * The identifier through which this event can be identified.
     */
    readonly identifier: string;

    // ---------------------------------------------------------------------------------------------
    // Location API
    // ---------------------------------------------------------------------------------------------

    /**
     * Returns an iterator with the names of the areas that exist within the event.
     */
    getAreas(): IterableIterator<string>;

    /**
     * Returns the location identified by the given |name|, or undefined when not found.
     */
    getLocation(name: string): EventLocation | undefined;

    /**
     * Returns an iterator that provides access to all locations for the event.
     */
    getLocations(): IterableIterator<EventLocation>;

    /**
     * Returns an iterator that provides access to all locations for the event within the |area|.
     */
    getLocationsForArea(area: string): IterableIterator<EventLocation>;

    // ---------------------------------------------------------------------------------------------
    // Volunteer API
    // ---------------------------------------------------------------------------------------------

    /**
     * Returns the volunteer identified by the given |identifier|, or undefined when not found.
     */
    getVolunteer(identifier: string): EventVolunteer | undefined;

    /**
     * Returns an iterator that provides access to all volunteers known to the system.
     */
    getVolunteers(): IterableIterator<EventVolunteer>;
}

/**
 * Interface that documents the information known about a particular event within an event.
 */
export interface EventInfo {
    /**
     * Visitor-visible name summarising the event.
     */
    readonly title: string;

    /**
     * Short (1–3 sentence) description briefly summarising the event.
     */
    readonly description: string;

    /**
     * An array with the instances of this event that will be taking place. Sorted.
     */
    readonly sessions: EventSession[];
}

/**
 * Interface that documents the information known about a particular location for the event.
 */
export interface EventLocation {
    /**
     * Area in which the location is located. Could be a floor, or a section of the building.
     */
    readonly area: string;

    /**
     * Name of the location.
     */
    readonly name: string;

    /**
     * An array with the event sessions that will be taking place within this location. Sorted.
     */
    readonly sessions: EventSession[];
}

/**
 * Interface that documents the information known about an event session within an event.
 */
export interface EventSession {
    /**
     * Information about the event that this session is a part of.
     */
    readonly event: EventInfo;

    /**
     * Information about the location in which this session will be taking place.
     */
    readonly location: EventLocation;

    /**
     * Time at which this session is due to begin.
     */
    readonly startTime: moment.Moment;

    /**
     * Time at which this session is due to finish. Guaranteed to be after the `startTime`.
     */
    readonly endTime: moment.Moment;
}

/**
 * Interface that documents the information known about a particular volunteer for the event.
 */
export interface EventVolunteer {
    /**
     * The volunteer's full name.
     */
    readonly name: string;

    /**
     * The volunteer's first name.
     */
    readonly firstName: string;

    /**
     * The volunteer's last name.
     */
    readonly lastName: string;

    /**
     * Unique identifier for this volunteer. Should be unique within this event.
     */
    readonly identifier: string;

    /**
     * URL to the avatar image to use for the volunteer, if any.
     */
    readonly avatar?: string;
}
