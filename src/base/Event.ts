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
}
