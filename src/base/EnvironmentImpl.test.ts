// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import 'jest-localstorage-mock';

import mockConsole from 'jest-mock-console';
import mockFetch from 'jest-fetch-mock';

import { ConfigurationImpl } from './ConfigurationImpl';
import { EnvironmentImpl } from './EnvironmentImpl';

describe('EnvironmentImpl', () => {
    beforeEach(() => sessionStorage.clear());

    /**
     * Creates an instance of the EnvironmentImpl object. The |environment| will be served through
     * mocked HTTP fetches, with the appropriate response being given.
     * 
     * @param status The HTTP status code the mock server should respond with.
     * @param environment The environment that should be returned by the mock server.
     */
    function createInstance(status: number, environment: object): EnvironmentImpl {
        const configuration = new ConfigurationImpl();

        mockFetch.mockOnceIf(configuration.getEnvironmentEndpoint(), async request => {
            return {
                body: JSON.stringify(environment),
                status,
            };
        });

        return new EnvironmentImpl(configuration);
    }

    it('should reflect the values of a valid environment from the network', async () => {
        const environment = createInstance(200, {
            contactName: 'Peter',
            contactNumber: undefined,
            events: [
                {
                    name: 'Event Name',
                    enablePortal: true,
                    enableRegistration: false,
                    timezone: 'Europe/London',
                    website: 'https://example.com/'
                }
            ],
            title: 'Volunteer Portal',
        });

        expect(await environment.initialize()).toBeTruthy();

        expect(environment.contactName).toEqual('Peter');
        expect(environment.contactNumber).toBeUndefined();
        expect(environment.title).toEqual('Volunteer Portal');

        expect(environment.events).toHaveLength(1);
        expect(environment.events[0].name).toEqual('Event Name');
        expect(environment.events[0].enablePortal).toBeTruthy();
        expect(environment.events[0].enableRegistration).toBeFalsy();
        expect(environment.events[0].timezone).toEqual('Europe/London');
        expect(environment.events[0].website).toEqual('https://example.com/');

        expect(sessionStorage.getItem).toHaveBeenCalledTimes(1);
        expect(sessionStorage.setItem).toHaveBeenCalledTimes(1);
    });

    it('should reflect the values of a valid environment from session storage', async () => {
        sessionStorage.setItem(EnvironmentImpl.kCacheName, JSON.stringify({
            contactName: 'Ferdi',
            contactNumber: '0000-00-000',
            events: [
                {
                    name: 'Event Name',
                    enablePortal: false,
                    enableRegistration: true,
                    timezone: 'Europe/Amsterdam',
                    /* website: omitted */
                }
            ],
            title: 'Volunteer Portal',
        }));

        const environment = createInstance(404, {});

        expect(await environment.initialize()).toBeTruthy();

        expect(environment.contactName).toEqual('Ferdi');
        expect(environment.contactNumber).toEqual('0000-00-000');
        expect(environment.title).toEqual('Volunteer Portal');

        expect(environment.events).toHaveLength(1);
        expect(environment.events[0].name).toEqual('Event Name');
        expect(environment.events[0].enablePortal).toBeFalsy();
        expect(environment.events[0].enableRegistration).toBeTruthy();
        expect(environment.events[0].timezone).toEqual('Europe/Amsterdam');
        expect(environment.events[0].website).toBeUndefined();

        expect(sessionStorage.getItem).toHaveBeenCalledTimes(2);
        expect(sessionStorage.setItem).toHaveBeenCalledTimes(2);
    });

    it('should fail when the API endpoint is unavailable', async () => {
        const environment = createInstance(404, {});
        const restoreConsole = mockConsole();

        // Failure because fetching the API endpoint returns a 404 status.
        expect(await environment.initialize()).toBeFalsy();
        expect(console.error).toHaveBeenCalledTimes(1);

        restoreConsole();
    });

    it('should fail when the API endpoint returns invalid data', async () => {
        const environment = createInstance(200, { fruit: 'banana' });
        const restoreConsole = mockConsole();

        // Failure because data fetched from the API endpoint does not match to [[IEnvironment]].
        expect(await environment.initialize()).toBeFalsy();
        expect(console.error).toHaveBeenCalledTimes(1);

        restoreConsole();
    });

    it('should throw when accessing properties before a successful initialization', () => {
        const environment = createInstance(404, {});
        const restoreConsole = mockConsole();

        expect(() => environment.contactName).toThrowError();
        expect(() => environment.contactNumber).toThrowError();
        expect(() => environment.events).toThrowError();
        expect(() => environment.title).toThrowError();

        restoreConsole();
    });
});
