// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { RestoreConsole, default as mockConsole } from 'jest-mock-console';
import { clear as kvClear } from 'idb-keyval';
import mockFetch from 'jest-fetch-mock';

import type { IEventResponse } from '../api/IEvent';

import { EventImpl } from './EventImpl';

describe('EventImpl', () => {
    let restoreConsole: RestoreConsole | undefined = undefined;

    afterEach(() => restoreConsole!());
    beforeEach(async () => {
        // (1) Install the moacked console, to catch console.error() messages.
        restoreConsole = mockConsole();

        // (2) Clear the cache, as this test suite depends on validating caching behaviour.
        await kvClear();

        // (3) Establish the canonical response to the Event API used by tests in this suite. The
        // response should be sufficiently complete to allow for the individual unit tests to pass.
        mockFetch.mockIf('/api/event?authToken=my-token&event=2022-regular', async request => ({
            body: JSON.stringify({
                areas: [
                    {
                        identifier: 'Pyramids',
                        name: 'The Pyramids',
                        icon: '/images/pyramid.png',
                    },
                    {
                        identifier: 'Towers',
                        name: 'The Towers',
                    },
                ],
                events: [],
                locations: [],
                meta: {
                    name: 'Event Name',
                    timezone: 'Europe/Amsterdam',
                },
                volunteers: [],
            }),
            status: 200,
        }));
    });

    it('should throw when accessing properties of an uninitialized event', async () => {
        const event = new EventImpl({ authToken: 'my-token', event: '2022-regular' });

        expect(event.initialized).toBeFalsy();
        expect(event.identifier).toEqual('2022-regular');
        expect(() => event.name).toThrowError();
        expect(() => event.timezone).toThrowError();

        expect(event.area('identifier')).toBeUndefined();
        expect([ ...event.areas() ]).toHaveLength(0);

        // TODO: Add the method calls?
    });

    it('should reflect the meta-information of a valid event from the network', async () => {
        const event = new EventImpl({ authToken: 'my-token', event: '2022-regular' });
        expect(await event.initialize()).toBeTruthy();

        expect(event.name).toEqual('Event Name');
        expect(event.timezone).toEqual('Europe/Amsterdam');
    });

    it('should reflect the area information of a valid event from the network', async () => {
        const event = new EventImpl({ authToken: 'my-token', event: '2022-regular' });
        expect(await event.initialize()).toBeTruthy();

        expect(event.area(/* identifier= */ 'Pyramids')).not.toBeUndefined();
        expect(event.area(/* identifier= */ 'Towers')).not.toBeUndefined();

        expect([ ...event.areas() ].map(area => area.name)).toEqual([
            'The Pyramids',
            'The Towers',
        ]);

        const pyramids = event.area(/* identifier= */ 'Pyramids')!;
        expect(pyramids.identifier).toEqual('Pyramids');
        expect(pyramids.name).toEqual('The Pyramids');
        expect(pyramids.icon).toEqual('/images/pyramid.png');

        const towers = event.area(/* identifier= */ 'Towers')!;
        expect(towers.icon).toBeUndefined();

        // TODO: Validate that each area has the correct location associations.
    });

    it('should fail when the API endpoint is unavailable', async () => {
        mockFetch.mockOnceIf('/api/event?authToken=my-token&event=2022-regular', async request => ({
            status: 503,
        }));

        const event = new EventImpl({ authToken: 'my-token', event: '2022-regular' });
        expect(await event.initialize()).toBeFalsy();

        expect(event.initialized).toBeFalsy();
        expect(() => event.name).toThrowError();
    });
});
