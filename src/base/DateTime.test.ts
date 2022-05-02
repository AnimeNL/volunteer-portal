// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import moment from 'moment-timezone';

import { DateTime } from './DateTime';

describe('DateTime', () => {
    beforeEach(() => {
        DateTime.setDefaultTimezone(/* reset= */ undefined);
        DateTime.setOverrideDiff(/* reset= */ undefined);
    });

    it('is able to create timestamps from local, utc and external time sources', () => {
        const currentTimeLocal = DateTime.local();
        expect(currentTimeLocal.isUTC()).toBeFalsy();

        const currentTimeUtc = DateTime.utc();
        expect(currentTimeUtc.isUTC()).toBeTruthy();

        const date = DateTime.fromUnix(1577880000);
        expect(date.unix()).toEqual(1577880000);
    });

    it('is able to create timestamps based on a global timezone setting', () => {
        DateTime.setDefaultTimezone('Europe/Amsterdam');
        {
            const localAmsterdam = DateTime.local();
            expect([ /* DST= */ 120, /* ST= */ 60 ]).toContain(localAmsterdam.utcOffset());

            const dateAmsterdam = DateTime.fromUnix(1577880000);
            expect(dateAmsterdam.format()).toEqual('2020-01-01 13:00:00');
        }

        DateTime.setDefaultTimezone('Europe/London');
        {
            const localLondon = DateTime.local();
            expect([ /* DST= */ 60, /* ST= */ 0 ]).toContain(localLondon.utcOffset());

            const dateLondon = DateTime.fromUnix(1577880000);
            expect(dateLondon.format()).toEqual('2020-01-01 12:00:00');
        }

        DateTime.setDefaultTimezone('America/New_York');
        {
            const localNewYork = DateTime.local();
            expect([ /* DST= */ -240, /* ST= */ -300 ]).toContain(localNewYork.utcOffset());

            const dateNewYork = DateTime.fromUnix(1577880000);
            expect(dateNewYork.format()).toEqual('2020-01-01 07:00:00');
        }

        DateTime.setDefaultTimezone(/* reset= */ undefined);
        {
            const currentTimeLocal = DateTime.local();
            expect(currentTimeLocal.isUTC()).toBeFalsy();
        }
    });

    it('has the ability to override locally vended times', () => {
        DateTime.setDefaultTimezone('Europe/London');

        const localTime = DateTime.local();
        const localTimeUtc = DateTime.utc();

        const overrideMoment = DateTime.fromString('2020-01-01T13:00:00+01:00').moment();
        DateTime.setOverrideDiff(overrideMoment.diff(moment(), 'ms'));

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

        DateTime.setOverrideDiff(/* reset= */ undefined);

        expect(localTime.format('date')).toEqual(DateTime.local().format('date'));
        expect(localTimeUtc.format('date')).toEqual(DateTime.utc().format('date'));
    });

    it('has the ability to do basic operations on DateTime instances', () => {
        const morning = DateTime.fromString('2022-06-10T08:00:00+01:00');
        const afternoon = DateTime.fromString('2022-06-10T13:00:00+01:00');
        const evening = DateTime.fromString('2022-06-10T20:00:00+01:00');
        const night = DateTime.fromString('2022-06-11T00:00:00+01:00');

        // isBefore
        expect(morning.isBefore(afternoon)).toBeTruthy();
        expect(evening.isBefore(afternoon)).toBeFalsy();
        expect(morning.isBefore(morning)).toBeFalsy();
    });

    it('has the ability to create textual representations of distances', () => {
        DateTime.setDefaultTimezone('Europe/Amsterdam');

        // formatUntil
        {
            const afternoon = DateTime.fromString('2022-06-10T13:00:00+02:00');
            const evening = DateTime.fromString('2022-06-10T20:15:00+02:00');
            const tomorrow = DateTime.fromString('2022-06-11T18:00:00+02:00');
            const christmas = DateTime.fromString('2022-12-25T12:00:00+02:00');

            expect(afternoon.formatUntil(evening)).toEqual('until 20:15');
            expect(afternoon.formatUntil(tomorrow)).toEqual('until Sat, 18:00');
            expect(afternoon.formatUntil(christmas)).toEqual('until Dec 25th');

            expect(afternoon.formatUntil(afternoon)).toEqual('now');

            expect(christmas.formatUntil(afternoon)).toEqual('in the past');
        }
    });
});
