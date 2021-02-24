// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

/**
 * Defines the Environment object that's available to all applications. It will be loaded prior to
 * application dispatch by the ApplicationLoader.
 */
export interface Environment {
    /**
     * Returns the name of the event this portal is running for.
     */
    getEventName(): string;

    /**
     * Returns the title of the portal.
     */
    getPortalTitle(): string;

    /**
     * Returns the title that should be given to a senior volunteer.
     */
    getSeniorTitle(): string;

    /**
     * Returns the timezone name (per the tz database) the portal should be running in.
     * @see https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
     */
    getTimezone(): string;

    /**
     * Returns the year in which the portal's event will be taking place.
     */
    getYear(): number;
}
