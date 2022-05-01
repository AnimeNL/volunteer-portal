// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { DateTime } from './DateTime';

describe('DateTime', () => {
    beforeEach(() => {
        DateTime.setDefaultTimezone(/* reset= */ undefined);
        DateTime.setOverrideTime(/* reset= */ undefined);
    });

    // Whether the machine on which the tests are being run is in UTC.
    const kMachineIsUTC = Math.abs((new Date).getTimezoneOffset()) === 0;

    it('is able to create timestamps from local, utc and external time sources', () => {
        return;  // disabled until I figure out what to do with timezones

        const currentTimeLocal = DateTime.local();
        expect(currentTimeLocal.isUTC()).toEqual(kMachineIsUTC);

        const currentTimeUtc = DateTime.utc();
        expect(currentTimeUtc.isUTC()).toBeTruthy();

        const date = DateTime.fromUnix(1577880000);
        expect(date.unix()).toEqual(1577880000);
    });

    it('is able to create timestamps based on a global timezone setting', () => {
        return;  // disabled until I figure out what to do with timezones

        DateTime.setDefaultTimezone('Europe/Amsterdam');
        {
            const localAmsterdam = DateTime.local();
            expect(localAmsterdam.utcOffset()).toEqual(60);

            const dateAmsterdam = DateTime.fromUnix(1577880000);
            expect(dateAmsterdam.format()).toEqual('2020-01-01 13:00:00');
        }

        DateTime.setDefaultTimezone('Europe/London');
        {
            const localLondon = DateTime.local();
            expect(localLondon.utcOffset()).toEqual(0);

            const dateLondon = DateTime.fromUnix(1577880000);
            expect(dateLondon.format()).toEqual('2020-01-01 12:00:00');
        }

        DateTime.setDefaultTimezone('America/New_York');
        {
            const localNewYork = DateTime.local();
            expect(localNewYork.utcOffset()).toEqual(-300);

            const dateNewYork = DateTime.fromUnix(1577880000);
            expect(dateNewYork.format()).toEqual('2020-01-01 07:00:00');
        }

        DateTime.setDefaultTimezone(/* reset= */ undefined);
        {
            const currentTimeLocal = DateTime.local();
            expect(currentTimeLocal.isUTC()).toEqual(kMachineIsUTC);
        }
    });

    it('has the ability to override locally vended times', () => {
        DateTime.setDefaultTimezone('Europe/London');

        const localTime = DateTime.local();
        const localTimeUtc = DateTime.utc();

        DateTime.setOverrideTime(DateTime.fromString('2020-01-01T13:00:00+01:00'));

        const adjustedTime = DateTime.local();
        const adjustedTimeUtc = DateTime.utc();

        expect(localTime.format('date')).not.toEqual(adjustedTime.format('date'));
        expect(localTimeUtc.format('date')).not.toEqual(adjustedTimeUtc.format('date'));

        expect(adjustedTime.format('date')).toEqual('2020-01-01');
        expect(adjustedTimeUtc.format('date')).toEqual('2020-01-01');

        // Creating time instances from UNIX timestamps should be unaffected.

        const unixTime = DateTime.fromUnix(1609502400);
        expect(unixTime.format('date')).toEqual('2021-01-01');

        // The override must be clearable again as well.

        DateTime.setOverrideTime(/* reset= */ undefined);

        expect(localTime.format('date')).toEqual(DateTime.local().format('date'));
        expect(localTimeUtc.format('date')).toEqual(DateTime.utc().format('date'));
    });
});
