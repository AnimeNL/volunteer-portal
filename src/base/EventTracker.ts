// Copyright 2022 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

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

    // TODO: Active events (total count)
    // TODO: Active volunteers (total count)
    // TODO: Active state for each volunteer
}
