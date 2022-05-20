// Copyright 2022 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { RestoreConsole, default as mockConsole } from 'jest-mock-console';

import { DateTime } from './DateTime';
import { EventImpl } from './EventImpl';
import { EventTrackerImpl } from './EventTrackerImpl';

describe('EventTrackerImpl', () => {
    let restoreConsole: RestoreConsole | undefined;

    let event: EventImpl | undefined;
    let eventTracker: EventTrackerImpl | undefined;

    afterEach(() => restoreConsole!());
    beforeEach(async () => {
        // (1) Install the moacked console, to catch console.error() messages.
        restoreConsole = mockConsole();

        // (2) Install a mocked |event| object to run the EventTrackerImpl on.
        event = new EventImpl({
            authToken: 'auth-token',
            event: 'event-identifier',
        });

        event.onSuccessResponse({
            areas: [
                { identifier: 'area-a', name: 'Area A' },
                { identifier: 'area-b', name: 'Area B' },
            ],
            events: [
                {
                    identifier: 'event-1',
                    hidden: false,
                    sessions: [
                        { location: 'location-a-1', name: 'Session 1', time: [ 0, 3600 ] },
                        { location: 'location-a-1', name: 'Session 2', time: [ 3600, 7200 ] },
                    ],
                },
                {
                    identifier: 'event-2',
                    hidden: false,
                    sessions: [
                        { location: 'location-b-1', name: 'Session 3', time: [ 3600, 7000 ] },
                        { location: 'location-b-2', name: 'Session 4', time: [ 5400, 7200 ] },
                    ]
                },
            ],
            locations: [
                { identifier: 'location-a-1', name: 'Location 1', area: 'area-a' },
                { identifier: 'location-a-2', name: 'Location 2', area: 'area-a' },
                { identifier: 'location-b-1', name: 'Location 3', area: 'area-b' },
                { identifier: 'location-b-2', name: 'Location 4', area: 'area-b' },
            ],
            meta: {
                name: 'Mocked event',
                time: [ Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER ],
                timezone: 'Europe/Amsterdam',
            },
            volunteers: [
                {
                    identifier: 'volunteer-a',
                    name: [ 'Volunteer', 'A' ],
                    environments: { /* none */ },
                    shifts: [
                        { type: 'shift', event: 'event-1', time: [ 5400, 7000 ] },
                        { type: 'shift', event: 'event-1', time: [ 7000, 7200 ] },
                    ]
                },
                {
                    identifier: 'volunteer-b',
                    name: [ 'Volunteer', 'B' ],
                    environments: { /* none */ },
                    shifts: [
                        { type: 'shift', event: 'event-1', time: [ 6300, 7200 ] },
                    ],
                }
            ]
        });

        // (3) Install a mocked |eventTracker| that we'll be using for these tests.
        eventTracker = new EventTrackerImpl(event);
    });

    // Helper function to avoid needing exclamation mark asserts all throughout this file.
    function assertNotNullOrUndefined(value: any): asserts value {
        if (!value)
            throw new Error('The |value| is unexpectedly null or undefined.');
    }

    test('it can provide the time until the next program update', () => {
        assertNotNullOrUndefined(eventTracker);

        expect(eventTracker.getNextUpdateDateTime()).toBeUndefined();

        eventTracker.update(DateTime.fromUnix(2000));
        expect(eventTracker.getNextUpdateDateTime()).not.toBeUndefined();
        expect(eventTracker.getNextUpdateDateTime()?.unix()).toEqual(3600);

        eventTracker.update(DateTime.fromUnix(3600));
        expect(eventTracker.getNextUpdateDateTime()).not.toBeUndefined();
        expect(eventTracker.getNextUpdateDateTime()?.unix()).toEqual(5400);

        eventTracker.update(DateTime.fromUnix(7000));
        expect(eventTracker.getNextUpdateDateTime()).not.toBeUndefined();
        expect(eventTracker.getNextUpdateDateTime()?.unix()).toEqual(7200);

        eventTracker.update(DateTime.fromUnix(7200));
        expect(eventTracker.getNextUpdateDateTime()).toBeUndefined();
    });

    test('it can provide the number of active events', () => {
        assertNotNullOrUndefined(eventTracker);
        assertNotNullOrUndefined(event);

        const areaA = event.area('area-a');
        assertNotNullOrUndefined(areaA);

        const areaB = event.area('area-b');
        assertNotNullOrUndefined(areaB);

        expect(eventTracker.getActiveSessionCount()).toEqual(0);
        expect(eventTracker.getActiveSessionCountForArea(areaA)).toEqual(0);
        expect(eventTracker.getActiveSessionCountForArea(areaB)).toEqual(0);
        expect(eventTracker.getActiveSessions()).toHaveLength(0);

        eventTracker.update(DateTime.fromUnix(0));
        expect(eventTracker.getActiveSessionCount()).toEqual(1);
        expect(eventTracker.getActiveSessionCountForArea(areaA)).toEqual(1);
        expect(eventTracker.getActiveSessionCountForArea(areaB)).toEqual(0);
        expect(eventTracker.getActiveSessions()).toHaveLength(1);

        eventTracker.update(DateTime.fromUnix(3600));
        expect(eventTracker.getActiveSessionCount()).toEqual(2);
        expect(eventTracker.getActiveSessionCountForArea(areaA)).toEqual(1);
        expect(eventTracker.getActiveSessionCountForArea(areaB)).toEqual(1);
        expect(eventTracker.getActiveSessions()).toHaveLength(2);

        eventTracker.update(DateTime.fromUnix(5400));
        expect(eventTracker.getActiveSessionCount()).toEqual(3);
        expect(eventTracker.getActiveSessionCountForArea(areaA)).toEqual(1);
        expect(eventTracker.getActiveSessionCountForArea(areaB)).toEqual(2);
        expect(eventTracker.getActiveSessions()).toHaveLength(3);

        eventTracker.update(DateTime.fromUnix(7100));
        expect(eventTracker.getActiveSessionCount()).toEqual(2);
        expect(eventTracker.getActiveSessionCountForArea(areaA)).toEqual(1);
        expect(eventTracker.getActiveSessionCountForArea(areaB)).toEqual(1);
        expect(eventTracker.getActiveSessions()).toHaveLength(2);

        eventTracker.update(DateTime.fromUnix(7200));
        expect(eventTracker.getActiveSessionCount()).toEqual(0);
        expect(eventTracker.getActiveSessionCountForArea(areaA)).toEqual(0);
        expect(eventTracker.getActiveSessionCountForArea(areaB)).toEqual(0);
        expect(eventTracker.getActiveSessions()).toHaveLength(0);
    });

    test('it can provide the count and activities of active volunteers', () => {
        assertNotNullOrUndefined(eventTracker);
        assertNotNullOrUndefined(event);

        const volunteerA = event.volunteer({ identifier: 'volunteer-a' });
        assertNotNullOrUndefined(volunteerA);

        const volunteerB = event.volunteer({ identifier: 'volunteer-b' });
        assertNotNullOrUndefined(volunteerB);

        expect(eventTracker.getActiveVolunteerCount()).toEqual(0);
        expect(eventTracker.getVolunteerActivity(volunteerA)).toEqual('unavailable');
        expect(eventTracker.getVolunteerUpcomingShift(volunteerA)).toBeUndefined();
        expect(eventTracker.getVolunteerActivity(volunteerB)).toEqual('unavailable');
        expect(eventTracker.getVolunteerUpcomingShift(volunteerB)).toBeUndefined();

        eventTracker.update(DateTime.fromUnix(0));
        expect(eventTracker.getActiveVolunteerCount()).toEqual(0);
        expect(eventTracker.getVolunteerActivity(volunteerA)).toEqual('unavailable');
        expect(eventTracker.getVolunteerUpcomingShift(volunteerA)).toBeInstanceOf(Object);
        expect(eventTracker.getVolunteerActivity(volunteerB)).toEqual('unavailable');
        expect(eventTracker.getVolunteerUpcomingShift(volunteerB)).toBeInstanceOf(Object);

        eventTracker.update(DateTime.fromUnix(5400));
        expect(eventTracker.getActiveVolunteerCount()).toEqual(1);
        expect(eventTracker.getVolunteerActivity(volunteerA)).toBeInstanceOf(Object);
        expect(eventTracker.getVolunteerUpcomingShift(volunteerA)).toBeInstanceOf(Object);
        expect(eventTracker.getVolunteerActivity(volunteerB)).toEqual('unavailable');
        expect(eventTracker.getVolunteerUpcomingShift(volunteerB)).toBeInstanceOf(Object);

        eventTracker.update(DateTime.fromUnix(6666));
        expect(eventTracker.getActiveVolunteerCount()).toEqual(2);
        expect(eventTracker.getVolunteerActivity(volunteerA)).toBeInstanceOf(Object);
        expect(eventTracker.getVolunteerUpcomingShift(volunteerA)).toBeInstanceOf(Object);
        expect(eventTracker.getVolunteerActivity(volunteerB)).toBeInstanceOf(Object);
        expect(eventTracker.getVolunteerUpcomingShift(volunteerB)).toBeUndefined();

        eventTracker.update(DateTime.fromUnix(7200));
        expect(eventTracker.getActiveVolunteerCount()).toEqual(0);
        expect(eventTracker.getVolunteerActivity(volunteerA)).toEqual('unavailable');
        expect(eventTracker.getVolunteerUpcomingShift(volunteerA)).toBeUndefined();
        expect(eventTracker.getVolunteerActivity(volunteerB)).toEqual('unavailable');
        expect(eventTracker.getVolunteerUpcomingShift(volunteerB)).toBeUndefined();
    });
});
