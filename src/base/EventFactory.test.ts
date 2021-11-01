// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { RestoreConsole, default as mockConsole } from 'jest-mock-console';
import mockFetch from 'jest-fetch-mock';

import { Cache } from './Cache';
import { ConfigurationImpl } from './ConfigurationImpl';
import { EventFactory } from './EventFactory';
import { EventImpl } from './EventImpl';

describe('EventFactory', () => {
    let restoreConsole: RestoreConsole | undefined = undefined;

    beforeEach(() => restoreConsole = mockConsole());
    afterEach(() => restoreConsole!());

    /**
     * Fixed authentication token that will be used throughout the tests.
     */
    const kAuthToken = 'foo';

    /**
     * Fixed event identifier that will be used throughout the tests.
     */
    const kEventIdentifier = '2021-event';

    /**
     * Creates an instance of the EventFactory object, where the given |event| will be served
     *
     * @param identifier Unique identifier for the
     * @param status The HTTP status code the mock server should respond with.
     * @param event The environment that should be returned by the mock server.
     */
    async function createInstance(identifier: string, status: number, event: object) {
        const cache = new Cache();
        const configuration = new ConfigurationImpl();
        const endpoint = configuration.getEventEndpoint(kAuthToken, identifier);

        // Always clear the cache prior to creating a new instance.
        await cache.delete(EventFactory.cacheKeyForIdentifier(identifier));

        mockFetch.mockOnceIf(endpoint, async request => {
            return {
                body: JSON.stringify(event),
                status,
            };
        });

        return {
            cache,
            factory: new EventFactory(cache, configuration)
        };
    }

    it('should be able to issue an EventImpl object from the network', async () => {
        const { factory } = await createInstance(kEventIdentifier, 200, {
            areas: [
                {
                    identifier: 'Towers',
                    name: 'The Towers',
                }
            ],
            events: [
                {
                    identifier: 'my-event',
                    hidden: false,
                    sessions: [
                        { name: 'My Event', location: 'round-tower', time: [ 10, 20 ] },
                        { name: 'My Event', location: 'round-tower', time: [ 25, 35 ] },
                    ]
                }
            ],
            locations: [
                {
                    identifier: 'round-tower',
                    name: 'Round Tower',
                    area: 'Towers',
                }
            ],
            volunteers: [],
        });

        const event = await factory.load(kAuthToken, kEventIdentifier);

        expect(event).toBeInstanceOf(EventImpl);
        expect(event?.identifier).toBe(kEventIdentifier);
    });

    it('should be able to issue an EventImpl object from the cache', async () => {
        const { cache, factory } = await createInstance(kEventIdentifier, 404, {
            /* no response */
        });

        await cache.set(EventFactory.cacheKeyForIdentifier(kEventIdentifier), {
            areas: [
                {
                    identifier: 'Towers',
                    name: 'The Towers',
                }
            ],
            events: [
                {
                    identifier: 'my-event',
                    hidden: false,
                    sessions: [
                        { name: 'My Event', location: 'round-tower', time: [ 10, 20 ] },
                        { name: 'My Event', location: 'round-tower', time: [ 25, 35 ] },
                    ]
                }
            ],
            locations: [
                {
                    identifier: 'round-tower',
                    name: 'Round Tower',
                    area: 'Towers',
                }
            ],
            volunteers: [],
        });

        const event = await factory.load(kAuthToken, kEventIdentifier);

        expect(event).toBeInstanceOf(EventImpl);
        expect(event?.identifier).toBe(kEventIdentifier);
    });

    it('should refuse to return an EventImpl object when there are network issues', async () => {
        const { factory } = await createInstance(kEventIdentifier, 404, { /* no response */ });

        expect(await factory.load(kAuthToken, kEventIdentifier)).toBeUndefined();
    });

    it('should refuse to return an EventImpl object when there are validation issues', async () => {
        const { factory } = await createInstance(kEventIdentifier, 200, {
            /* all expected properties are missing */
            randomData: false,
        });

        expect(await factory.load(kAuthToken, kEventIdentifier)).toBeUndefined();
    });
});
