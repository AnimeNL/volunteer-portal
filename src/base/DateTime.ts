// Copyright 2022 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import moment from 'moment-timezone';

/**
 * Storage index (in kv-storage) for the date override, when applicable. The data being stored
 * should be a number in milliseconds.
 */
export const kDateOverrideStorageKey = 'vp-date-override';

/**
 * Date formatting rules supported by the application. One of these keys must be passed to format().
 */
const kFormatRules = {
    date: 'YYYY-MM-DD',
    full: 'YYYY-MM-DD HH:mm:ss',
};

/**
 * Non-exported symbol to avoid external users from instantiating DateTime instances themselves.
 */
const kPrivateSymbol = Symbol(/* do not instantiate DateTime yourself */);

/**
 * Global timezone default, as one of the timezone names recognised by the Intl API. Defaults to
 * Europe/Amsterdam to allow the volunteer portal to behave the same regardless of host locale.
 * Should not be set to UTC.
 */
let defaultTimezone: string = 'Europe/Amsterdam';

/**
 * Global override time, as an offset noted in the number of milliseconds. Locally vended times will
 * be adjusted based on this value. Can be set using `DateTime.setOverrideTime`.
 */
let overrideTimeOffsetMs: number = 0;

/**
 * The DateTime class exposes a series of utilities for dealing with dates and times throughout the
 * volunteer portal application. It provides a minimal wrapping over another date/time library, to
 * allow us to easily swap out implementations when there's a need.
 */
export class DateTime {
    // ---------------------------------------------------------------------------------------------
    // Methods for globally changing DateTime behaviour throughout the application.
    // ---------------------------------------------------------------------------------------------

    /**
     * Returns the default timezone for which times in the application should be vended.
     */
    static getDefaultTimezone(): string {
        return defaultTimezone;
    }

    /**
     * Sets the default timezone for which times in the application should be vended. This overrides
     * the concept of a local timestamp, aligning it with the given |timezone|. Existing instances
     * will not be adjusted when this method is called.
     */
    static setDefaultTimezone(timezone?: string): void {
        defaultTimezone = timezone ?? 'Europe/Amsterdam';
    }

    /**
     * Returns whether an override time has been provided.
     */
    static hasOverrideDiff(): boolean {
        return overrideTimeOffsetMs !== 0;
    }

    /**
     * Sets the given |diffMs| as the global override time. Once activated, all local and UTC times
     * issued by this class will be amended based on the difference between |diffMs| and the actual
     * local time, which means that time will continue to progress.
     */
    static setOverrideDiff(diffMs?: number): void {
        overrideTimeOffsetMs = diffMs || /* no override= */ 0;
    }

    // ---------------------------------------------------------------------------------------------
    // Methods for retrieving a DateTime instance based on the current time
    // ---------------------------------------------------------------------------------------------

    /**
     * Returns a DateTime instance representing the current date and time. Local to the configured
     * timezone for this application, which defaults to UTC.
     */
    static local(): DateTime {
        return overrideTimeOffsetMs
            ? new DateTime(kPrivateSymbol, moment().add(overrideTimeOffsetMs, 'ms'))
            : new DateTime(kPrivateSymbol, moment.tz(defaultTimezone));
    }

    /**
     * Returns a DateTime instance representing the current date and time, in UTC.
     */
    static utc(): DateTime {
        return overrideTimeOffsetMs
            ? new DateTime(kPrivateSymbol, moment.utc().add(overrideTimeOffsetMs, 'ms'))
            : new DateTime(kPrivateSymbol, moment.utc());
    }

    // ---------------------------------------------------------------------------------------------
    // Methods for retrieving a DateTime instance based on an external time representation
    // ---------------------------------------------------------------------------------------------

    /**
     * Returns a DateTime instance representing the time indicated in |init|, which should be one of
     * the date/time formats supported by the underlying library.
     */
    static fromString(init: string): DateTime {
        return new DateTime(kPrivateSymbol, moment.tz(init, defaultTimezone));
    }

    /**
     * Returns a DateTime instance representing the time indicated in |timestamp|, which should be a
     * UNIX timestamp in seconds since the epoch. The DateTime will be localized to the application.
     */
    static fromUnix(timestamp: number): DateTime {
        return new DateTime(kPrivateSymbol, moment.tz(timestamp * 1000, defaultTimezone));
    }

    // ---------------------------------------------------------------------------------------------
    // Utilities provided by DateTime instances. Instances are strictly immutable.
    // ---------------------------------------------------------------------------------------------

    readonly #moment: moment.Moment;

    private constructor(privateSymbol: Symbol, moment: moment.Moment) {
        if (privateSymbol !== kPrivateSymbol)
            throw new Error('Do not instantiate DateTime yourself, use the static methods instead');

        this.#moment = moment;
    }

    /**
     * Formats the time represented by |this| to a string in accordance with the |rule|.
     */
    format(rule?: keyof typeof kFormatRules): string {
        return this.#moment.format(kFormatRules[rule ?? 'full']);
    }

    /**
     * Returns whether |this| is before |that|.
     */
    isBefore(that: DateTime): boolean {
        return this.#moment.isBefore(that.#moment);
    }

    /**
     * Returns whether |this| is in UTC.
     */
    isUTC(): boolean { return this.#moment.isUTC(); }

    /**
     * Returns |this| as a Moment instance. Should be avoided.
     */
    moment(): moment.Moment { return this.#moment; }

    /**
     * Returns the offset, in minutes, |this| is away from UTC.
     */
    utcOffset(): number { return this.#moment.utcOffset(); }

    /**
     * Returns the UNIX timestamp represented by |this|, in UTC.
     */
    unix(): number { return this.#moment.unix(); }

    /**
     * Returns the internal, numeric representation of |this|. Should be comparable.
     */
    valueOf(): number { return this.#moment.valueOf(); }
}
