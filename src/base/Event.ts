// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

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
