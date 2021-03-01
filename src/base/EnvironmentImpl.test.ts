// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { RestoreConsole, default as mockConsole } from 'jest-mock-console';
import mockFetch from 'jest-fetch-mock';

import { Cache } from './Cache';
import { ConfigurationImpl } from './ConfigurationImpl';
import { EnvironmentImpl } from './EnvironmentImpl';

describe('EnvironmentImpl', () => {
    let restoreConsole: RestoreConsole | undefined = undefined;

    beforeEach(() => restoreConsole = mockConsole());
    afterEach(() => restoreConsole!());

    /**
     * Creates an instance of the EnvironmentImpl object. The |environment| will be served through
     * mocked HTTP fetches, with the appropriate response being given.
     * 
     * @param status The HTTP status code the mock server should respond with.
     * @param environment The environment that should be returned by the mock server.
     */
    async function createInstance(status: number, environment: object) {
        const cache = new Cache();
        const configuration = new ConfigurationImpl();

        // Always clear the cache prior to creating a new instance.
        await cache.delete(EnvironmentImpl.kCacheKey);

        mockFetch.mockOnceIf(configuration.getEnvironmentEndpoint(), async request => {
            return {
                body: JSON.stringify(environment),
                status,
            };
        });

        return {
            cache,
            environment: new EnvironmentImpl(cache, configuration)
        };
    }

    it('should reflect the values of a valid environment from the network', async () => {
        const { cache, environment } = await createInstance(200, {
            contactName: 'Peter',
            contactTarget: undefined,
            events: [
                {
                    name: 'Event Name',
                    enablePortal: true,
                    enableReferences: true,
                    enableRegistration: false,
                    slug: 'event-name',
                    timezone: 'Europe/London',
                    website: 'https://example.com/'
                }
            ],
            title: 'Volunteer Portal',
        });

        expect(await cache.has(EnvironmentImpl.kCacheKey)).toBeFalsy();
        expect(await environment.initialize()).toBeTruthy();

        expect(environment.contactName).toEqual('Peter');
        expect(environment.contactTarget).toBeUndefined();
        expect(environment.title).toEqual('Volunteer Portal');

        expect(environment.events).toHaveLength(1);
        expect(environment.events[0].name).toEqual('Event Name');
        expect(environment.events[0].enablePortal).toBeTruthy();
        expect(environment.events[0].enableReferences).toBeTruthy();
        expect(environment.events[0].enableRegistration).toBeFalsy();
        expect(environment.events[0].slug).toEqual('event-name');
        expect(environment.events[0].timezone).toEqual('Europe/London');
        expect(environment.events[0].website).toEqual('https://example.com/');

        expect(await cache.has(EnvironmentImpl.kCacheKey)).toBeTruthy();
    });

    it('should reflect the values of a valid environment from the cache', async () => {
        const { cache, environment } = await createInstance(404, {});

        await cache.set(EnvironmentImpl.kCacheKey, {
            contactName: 'Ferdi',
            contactTarget: '0000-00-000',
            events: [
                {
                    name: 'Event Name',
                    enablePortal: false,
                    enableReferences: false,
                    enableRegistration: true,
                    slug: 'event-name',
                    timezone: 'Europe/Amsterdam',
                    /* website: omitted */
                }
            ],
            title: 'Volunteer Portal',
        });

        expect(await cache.has(EnvironmentImpl.kCacheKey)).toBeTruthy();

        restoreConsole!();

        expect(await environment.initialize()).toBeTruthy();

        expect(environment.contactName).toEqual('Ferdi');
        expect(environment.contactTarget).toEqual('0000-00-000');
        expect(environment.title).toEqual('Volunteer Portal');

        expect(environment.events).toHaveLength(1);
        expect(environment.events[0].name).toEqual('Event Name');
        expect(environment.events[0].enablePortal).toBeFalsy();
        expect(environment.events[0].enableReferences).toBeFalsy();
        expect(environment.events[0].enableRegistration).toBeTruthy();
        expect(environment.events[0].slug).toEqual('event-name');
        expect(environment.events[0].timezone).toEqual('Europe/Amsterdam');
        expect(environment.events[0].website).toBeUndefined();
    });

    it('should fail when the API endpoint is unavailable', async () => {
        const { environment } = await createInstance(404, {});

        // Failure because fetching the API endpoint returns a 404 status.
        expect(await environment.initialize()).toBeFalsy();
        expect(console.error).toHaveBeenCalledTimes(0);
    });

    it('should fail when the API endpoint returns invalid data', async () => {
        const { environment } = await createInstance(200, { fruit: 'banana' });

        // Failure because data fetched from the API endpoint does not match to [[IEnvironment]].
        expect(await environment.initialize()).toBeFalsy();
        expect(console.error).toHaveBeenCalledTimes(1);
    });

    it('should throw when accessing properties before a successful initialization', async () => {
        const { environment } = await createInstance(404, {});

        expect(() => environment.contactName).toThrowError();
        expect(() => environment.contactTarget).toThrowError();
        expect(() => environment.events).toThrowError();
        expect(() => environment.title).toThrowError();
    });
});
