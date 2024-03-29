// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import type { DateTime } from './DateTime';
import type { IAvatarRequest } from '../api/IAvatar';
import type { IEventResponsePrivilege } from '../api/IEvent';
import type { Invalidatable } from './Invalidatable';

/**
 * Interface that defines how code is expected to interact with information about a specific event.
 * This builds on top of the `IEventResponse` information retrieved from the Event API.
 */
export interface Event {
    /**
     * Whether the Event object has been initialized, and is ready for use.
     */
    readonly initialized: boolean;

    /**
     * The identifier through which this event can be identified.
     */
    readonly identifier: string;

    /**
     * Record if {volunteer identifier} to {unix timestamp} of advice requests. Easter egg.
     */
    readonly nardo?: Record<string, number>;

    /**
     * Name of the event, which can be publicly displayed in a user interface. Will throw when the
     * Event object has not been initialized yet.
     */
    readonly name: string;

    /**
     * Timezone in which the event will be taking place, when provided by the server. Will throw
     * when the Event object has not been initialized yet.
     */
    readonly timezone?: string;

    /**
     * Time at which the event will officially begin. (Sessions may happen prior to this.)
     */
    readonly startTime: DateTime;

    /**
     * Time at which this event will officially end. (Sessions may continue after this.)
     */
    readonly endTime: DateTime;

    // ---------------------------------------------------------------------------------------------
    // Lifetime API
    // ---------------------------------------------------------------------------------------------

    /**
     * Requests the event to be refreshed. This is an asynchronous process, for which no success
     * information will be returned beyond signalling to any attached observers.
     */
    refresh(): void;

    // ---------------------------------------------------------------------------------------------
    // Observer API
    // ---------------------------------------------------------------------------------------------

    /**
     * Includes the given |observer| in event invalidation signalling.
     */
    addObserver(observer: Invalidatable): void;

    /**
     * Removes the given |observer| from being included in invalidation signalling.
     */
    removeObserver(observer: Invalidatable): void;

    // ---------------------------------------------------------------------------------------------
    // Event API
    // ---------------------------------------------------------------------------------------------

    /**
     * Returns the event identified by the given |identifier|, or undefined when it does not exist.
     */
    event(identifier: string): EventInfo | undefined;

    /**
     * Returns an iterator with all the events that exist within the event.
     */
    events(): IterableIterator<EventInfo>;

    // ---------------------------------------------------------------------------------------------
    // Location API
    // ---------------------------------------------------------------------------------------------

    /**
     * Returns the area identified by the given |identifier|, or undefined when it does not exist.
     */
    area(identifier: string): EventArea | undefined;

    /**
     * Returns an iterator with the areas that exist within the event.
     */
    areas(): IterableIterator<EventArea>;

    /**
     * Returns the location identified by the given |identifier|, or undefined when not found.
     */
    location(identifier: string): EventLocation | undefined;

    /**
     * Returns an iterator that provides access to all locations for the event.
     */
    locations(): IterableIterator<EventLocation>;

    // ---------------------------------------------------------------------------------------------
    // User API
    // ---------------------------------------------------------------------------------------------

    /**
     * Whether the authenticated user has been granted the given |privilege| for this event.
     */
    hasUserPrivilege(privilege: IEventResponsePrivilege): boolean;

    // ---------------------------------------------------------------------------------------------
    // Volunteer API
    // ---------------------------------------------------------------------------------------------

    /**
     * Returns the volunteer identified by the given |identifier| (O(1) operation), or undefined
     * when no volunteer with such an identifier could be found.
     */
    volunteer(identifier: string): EventVolunteer | undefined;

    /**
     * Returns an iterator that provides access to all volunteers known to the system.
     */
    volunteers(): IterableIterator<EventVolunteer>;
}

/**
 * Interface that documents the information known about a location in the event's venue.
 */
export interface EventArea {
    /**
     * The unique identifier that has been assigned to this area.
     */
    readonly identifier: string;

    /**
     * The name this area should be known by.
     */
    readonly name: string;

    /**
     * The icon used to illustrate the area, if any.
     */
    readonly icon?: string;

    /**
     * An array with the locations that are part of this area.
     */
    readonly locations: EventLocation[];
}

/**
 * Interface that documents the information known about a particular event within an event.
 */
export interface EventInfo {
    /**
     * The unique identifier that has been assigned to this event.
     */
    readonly identifier: string;

    /**
     * Whether the event is visible to regular visitors.
     */
    readonly hidden: boolean;

    /**
     * Notes specific to this event that should be displayed in the user interface. This property is
     * writable as senior volunteers are able to push updates in real time.
     */
    notes?: string;

    /**
     * An array with the instances of this event that will be taking place. Sorted.
     */
    readonly sessions: EventSession[];

    /**
     * The shifts that have been assigned to this event, in ascending order by start time.
     */
    readonly shifts: EventShift[];
}

/**
 * Interface that documents the information known about a particular location for the event.
 */
export interface EventLocation {
    /**
     * The unique identifier that has been assigned to this location.
     */
    readonly identifier: string;

    /**
     * Area in which the location is located. Could be a floor, or a section of the building.
     */
    readonly area: EventArea;

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
     * Name of the event, as it should appear in the user interface.
     */
    readonly name: string;

    /**
     * Description of the event, when known and provided by the server.
     */
    readonly description?: string;

    /**
     * Time at which this session is due to begin.
     */
    readonly startTime: DateTime;

    /**
     * Time at which this session is due to finish. Guaranteed to be after the `startTime`.
     */
    readonly endTime: DateTime;
}

/**
 * Interface that documents the information known about a particular volunteer for the event.
 */
export interface EventVolunteer {
    /**
     * Uploads the avatar contained in |request| for this volunteer. The event and userToken for
     * the volunteer can be added automagically, the other properties are required. A boolean will
     * be returned indicating whether the upload was successful.
     */
    uploadAvatar(request: Omit<IAvatarRequest, 'event' | 'userToken'>): Promise<boolean>;

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
     * Object with the environments and roles in which this volunteer will be participating.
     */
    readonly environments: Record</* name= */ string, /* role= */ string>;

    /**
     * Unique identifier for this volunteer. Should be unique within this event.
     */
    readonly identifier: string;

    /**
     * The access code this volunteer uses to identify themselves, if shared by the server.
     */
    readonly accessCode?: string;

    /**
     * URL to the avatar image to use for the volunteer, if any.
     */
    readonly avatar?: string;

    /**
     * Notes specific to this volunteer that should be displayed in the user interface. Notes can be
     * updated by certain volunteers, thus this property is not read-only.
     */
    notes?: string;

    /**
     * The phone number using which this volunteer can be contacted, if shared by the server.
     */
    readonly phoneNumber?: string;

    /**
     * The shifts that have been assigned to this volunteer, in ascending order by start time.
     */
    readonly shifts: EventShift[];
}

/**
 * Interface that documents the information known about a particular shift.
 */
export interface EventShift {
    /**
     * The type of shift. Availability of volunteers within the festival's venue is included.
     */
    readonly type: 'available' | 'shift' | 'unavailable';

    /**
     * The event during which volunteers will be showing up. Only applicable to the "shift" type.
     */
    readonly event?: EventInfo;

    /**
     * The name of this shift. May be omitted, in which case the event information will be used.
     */
    readonly name?: string;

    /**
     * The volunteer who will be working on this shift.
     */
    readonly volunteer: EventVolunteer;

    /**
     * Time at which this shift is due to begin.
     */
    readonly startTime: DateTime;

     /**
      * Time at which this shift is due to finish. Guaranteed to be after the `startTime`.
      */
    readonly endTime: DateTime;
}
