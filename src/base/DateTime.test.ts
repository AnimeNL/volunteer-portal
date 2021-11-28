// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import dayjs from 'dayjs';

import { DateTime } from './DateTime';

describe('DateTime', () => {
    beforeEach(() => DateTime.setTimezone(/* reset= */ undefined));

    // Hours of offset from UTC for the machine on which the tests are being run.
    const kMachineUtcOffset = dayjs().tz().utcOffset();

    it('is able to create timestamps from local, utc and external time sources', () => {
        const currentTimeLocal = DateTime.local();
        expect(currentTimeLocal.utcOffset()).toEqual(kMachineUtcOffset);
        expect(currentTimeLocal.isUTC()).toEqual(Math.abs(kMachineUtcOffset) === 0);

        const currentTimeUtc = DateTime.utc();
        expect(currentTimeUtc.utcOffset()).toEqual(0);
        expect(currentTimeUtc.isUTC()).toBeTruthy();

        const date = DateTime.fromUnix(1577880000, /* utc= */ false);
        expect(date.utc().unix()).toEqual(1577880000);
    });

    it('is able to create timestamps based on a global timezone setting', () => {
        DateTime.setTimezone('Europe/Amsterdam');
        {
            const localAmsterdam = DateTime.local();
            expect(localAmsterdam.utcOffset()).toEqual(60);

            const dateAmsterdam = DateTime.fromUnix(1577880000);
            expect(dateAmsterdam.format()).toEqual('2020-01-01T13:00:00+01:00');

            const dateAmsterdamUtc = DateTime.fromUnix(1577880000, /* utc= */ true);
            expect(dateAmsterdamUtc.format()).toEqual('2020-01-01T12:00:00Z');
        }

        DateTime.setTimezone('Europe/London');
        {
            const localLondon = DateTime.local();
            expect(localLondon.utcOffset()).toEqual(0);

            const dateLondon = DateTime.fromUnix(1577880000);
            expect(dateLondon.format()).toEqual('2020-01-01T12:00:00Z');

            const dateLondonUtc = DateTime.fromUnix(1577880000, /* utc= */ true);
            expect(dateLondonUtc.format()).toEqual('2020-01-01T12:00:00Z');
        }

        DateTime.setTimezone('America/New_York');
        {
            const localNewYork = DateTime.local();
            expect(localNewYork.utcOffset()).toEqual(-300);

            const dateNewYork = DateTime.fromUnix(1577880000);
            expect(dateNewYork.format()).toEqual('2020-01-01T07:00:00-05:00');

            const dateNewYorkUtc = DateTime.fromUnix(1577880000, /* utc= */ true);
            expect(dateNewYorkUtc.format()).toEqual('2020-01-01T12:00:00Z');
        }

        DateTime.setTimezone(/* reset= */ undefined);
        {
            const local = DateTime.local();
            expect(local.utcOffset()).toEqual(kMachineUtcOffset);
        }
    });

    it('has the ability to override locally vended times', () => {
        DateTime.setTimezone('Europe/London');

        const localTime = DateTime.local();
        const localTimeUtc = DateTime.utc();

        DateTime.setOverrideTime(dayjs('2020-01-01T13:00:00+01:00'));

        const adjustedTime = DateTime.local();
        const adjustedTimeUtc = DateTime.utc();

        expect(localTime.format('YYYY-MM-DD')).not.toEqual(adjustedTime.format('YYYY-MM-DD'));
        expect(localTimeUtc.format('YYYY-MM-DD')).not.toEqual(adjustedTimeUtc.format('YYYY-MM-DD'));

        expect(adjustedTime.format('YYYY-MM-DD')).toEqual('2020-01-01');
        expect(adjustedTimeUtc.format('YYYY-MM-DD')).toEqual('2020-01-01');

        // Creating time instances from UNIX timestamps should be unaffected.

        const unixTime = DateTime.fromUnix(1609502400);
        const unitTimeUtc = DateTime.fromUnix(1609502400, /* utc= */ true);

        expect(unixTime.format('YYYY-MM-DD')).toEqual('2021-01-01');
        expect(unitTimeUtc.format('YYYY-MM-DD')).toEqual('2021-01-01');

        // The override must be clearable again as well.

        DateTime.setOverrideTime(/* reset= */ undefined);

        expect(localTime.format('YYYY-MM-DD')).toEqual(DateTime.local().format('YYYY-MM-DD'));
        expect(localTimeUtc.format('YYYY-MM-DD')).toEqual(DateTime.utc().format('YYYY-MM-DD'));
    });
});
