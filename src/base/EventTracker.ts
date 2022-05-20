// Copyright 2022 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import type { EventArea, EventInfo, EventSession, EventShift, EventVolunteer } from './Event';
import type { User } from './User';

import { DateTime } from './DateTime';

/**
 * The Event Tracker is a layer on top of the Event which keeps track of the active and upcoming
 * events. It supports a convenient API for quick querying.
 */
export interface EventTracker {
    // ---------------------------------------------------------------------------------------------
    // Mutation API
    // ---------------------------------------------------------------------------------------------

    /**
     * Advances the EventTracker state to the given |dateTime|. This is a potentially expensive
     * operation, as it's O(n+s) on the number of events (n) and shifts (s) in the schedule. When
     * given, the |user| will be used to determine the current volunteer as well.
     */
    update(dateTime: DateTime, user?: User): void;

    // ---------------------------------------------------------------------------------------------
    // Query API
    // ---------------------------------------------------------------------------------------------

    /**
     * Returns a DateTime instance at which the next program update will occur, or undefined when
     * the event has finished. This considers all sessions and shifts. Constant time operation.
     */
    getNextUpdateDateTime(): DateTime | undefined;

    /**
     * Returns the number of active sessions at this very moment. Constant time operation.
     */
    getActiveSessionCount(): number;

    /**
     * Returns the number of active sessions in |area| at this very moment. Constant time operation.
     */
    getActiveSessionCountForArea(area: EventArea): number;

    /**
     * Returns an array of the active sessions at this very moment. Constant time operation.
     */
    getActiveSessions(): EventSession[];

    /**
     * Returns the number of volunteers who are currently active on a shift. Volunteers who are
     * available are ignored for this method. Constant time operation.
     */
    getActiveVolunteerCount(): number;

    /**
     * Returns the EventVolunteer for the user that is logged in, if any. Constant time operation.
     */
    getUserVolunteer(): EventVolunteer | undefined;

    /**
     * Returns the current activity for the given |volunteer|. When they're active on a shift, the
     * event instance where they're helping out will be returned instead. Constant time operation.
     */
    getVolunteerActivity(volunteer: EventVolunteer): EventInfo | 'available' | 'unavailable';

    /**
     * Returns the upcoming shift for the given |volunteer|, if any. Constant time operation.
     */
    getVolunteerUpcomingShift(volunteer: EventVolunteer): EventShift | undefined;
}
