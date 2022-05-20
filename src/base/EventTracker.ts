// Copyright 2022 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import type { EventInfo, EventVolunteer } from './Event';

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
     * operation, as it's O(n+s) on the number of events (n) and shifts (s) in the schedule.
     */
    update(dateTime: DateTime): void;

    // ---------------------------------------------------------------------------------------------
    // Query API
    // ---------------------------------------------------------------------------------------------

    /**
     * Returns a DateTime instance at which the next program update will occur, or undefined when
     * the event has finished. This considers all sessions and shifts. Constant time operation.
     */
    getNextUpdateDateTime(): DateTime | undefined;

    /**
     * Returns the number of volunteers who are currently active on a shift. Volunteers who are
     * available are ignored for this method. Constant time operation.
     */
    getActiveVolunteerCount(): number;

    /**
     * Returns the current activity for the given |volunteer|. When they're active on a shift, the
     * event instance where they're helping out will be returned instead. Constant time operation.
     */
    getVolunteerActivity(volunteer: EventVolunteer): EventInfo | 'available' | 'unavailable';

    // TODO: Active events (total count)
}
