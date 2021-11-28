// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import dayjs from 'dayjs';

import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(timezone);
dayjs.extend(utc);

/**
 * Global override time, as an offset noted in the number of milliseconds. Locally vended times will
 * be adjusted based on this value. Can be set using `DateTime.setOverrideTime`.
 */
let overrideTimeOffsetMs: number | undefined;

/**
 * The DateTime class exposes a series of utilities for dealing with dates and times throughout the
 * volunteer portal application. Direct usage of Moment, DayJS or other libraries in other parts of
 * the portal should be avoided where possible.
 */
export class DateTime {
    // ---------------------------------------------------------------------------------------------
    // Methods for retrieving a DayJS instance based on the current time
    // ---------------------------------------------------------------------------------------------

    /**
     * Returns a DayJS instance representing the current date and time. Timezone dependent.
     */
    static local(): dayjs.Dayjs {
        return overrideTimeOffsetMs ? dayjs().tz().add(overrideTimeOffsetMs, 'ms')
                                    : dayjs().tz();
    }

    /**
     * Returns a DayJS instance representing the current date and time, in UTC.
     */
    static utc(): dayjs.Dayjs {
        return overrideTimeOffsetMs ? dayjs.utc().add(overrideTimeOffsetMs, 'ms')
                                    : dayjs.utc();
    }

    // ---------------------------------------------------------------------------------------------
    // Methods for retrieving a DayJS instance based on an external time representation
    // ---------------------------------------------------------------------------------------------

    /**
     * Returns a DayJS instance representing the time indicated in |timestamp|, which should be a
     * UNIX timestamp in seconds since the epoch. The time will be local, unless |utc| is set.
     */
    static fromUnix(timestamp: number, utc?: boolean): dayjs.Dayjs {
        return utc ? dayjs.unix(timestamp).utc()
                   : dayjs.unix(timestamp).tz();
    }

    // ---------------------------------------------------------------------------------------------
    // Methods for globally changing DayJS behaviour throughout the application.
    // ---------------------------------------------------------------------------------------------

    /**
     * Sets the default timezone for which times in the application should be vended. This overrides
     * the concept of a local timestamp, aligning it with the given |timezone|. Existing instances
     * will not be adjusted when this method is called.
     */
    static setTimezone(timezone?: string): void {
        dayjs.tz.setDefault(timezone);
    }

    /**
     * Sets the given |time| as the global override time. Once activated, all local and UTC times
     * issued by this class will be amended based on the difference between |time| and the actual
     * local time, which means that time will continue to progress.
     */
    static setOverrideTime(time?: dayjs.Dayjs): void {
        overrideTimeOffsetMs = time ? time.diff(/* difference in milliseconds to current time */)
                                    : undefined;
    }
}
