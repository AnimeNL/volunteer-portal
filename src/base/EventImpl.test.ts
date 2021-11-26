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
                        identifier: 'pyramids',
                        name: 'The Pyramids',
                        icon: '/images/pyramid.png',
                    },
                    {
                        identifier: 'towers',
                        name: 'The Towers',
                    },
                ],
                events: [],
                locations: [
                    {
                        identifier: 'square-tower',
                        name: 'Square Tower',
                        area: 'towers',
                    },
                    {
                        identifier: 'square-pyramid',
                        name: 'Square Pyramid',
                        area: 'pyramids',
                    },
                    {
                        identifier: 'round-tower',
                        name: 'Round Tower',
                        area: 'towers',
                    },
                ],
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

        expect(event.location('identifier')).toBeUndefined();
        expect([ ...event.locations() ]).toHaveLength(0);

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

        expect(event.area(/* identifier= */ 'pyramids')).not.toBeUndefined();
        expect(event.area(/* identifier= */ 'towers')).not.toBeUndefined();

        expect([ ...event.areas() ].map(area => area.name)).toEqual([
            'The Pyramids',
            'The Towers',
        ]);

        const pyramids = event.area(/* identifier= */ 'pyramids')!;
        expect(pyramids.identifier).toEqual('pyramids');
        expect(pyramids.name).toEqual('The Pyramids');
        expect(pyramids.icon).toEqual('/images/pyramid.png');

        expect(pyramids.locations).toHaveLength(1);

        const towers = event.area(/* identifier= */ 'towers')!;
        expect(towers.icon).toBeUndefined();

        expect(towers.locations).toHaveLength(2);
        expect(towers.locations.map(location => location.name)).toEqual([
            'Round Tower',
            'Square Tower',
        ]);
    });

    it('should reflect the location information of a valid event from the network', async () => {
        const event = new EventImpl({ authToken: 'my-token', event: '2022-regular' });
        expect(await event.initialize()).toBeTruthy();

        expect(event.location(/* identifier= */ 'round-tower')).not.toBeUndefined();
        expect(event.location(/* identifier= */ 'square-tower')).not.toBeUndefined();

        expect([ ...event.locations() ].map(location => location.name)).toEqual([
            'Square Tower',
            'Square Pyramid',
            'Round Tower',
        ]);

        const tower = event.location(/* identifier= */ 'square-tower')!;
        expect(tower.area).not.toBeUndefined();
        expect(tower.area.name).toEqual('The Towers');
        expect(tower.area.locations.includes(tower));

        expect(tower.identifier).toEqual('square-tower');
        expect(tower.name).toEqual('Square Tower');

        // TODO: Verify that the right sessions are included in the location.
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
