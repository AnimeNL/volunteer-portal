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
            eventName: 'Example Event',
            portalTitle: 'Example Title',
            seniorTitle: 'Example Senior',
            timezone: 'Europe/London',
            year: 2019
        });

        expect(await environment.initialize()).toBeTruthy();

        expect(environment.getEventName()).toEqual('Example Event');
        expect(environment.getPortalTitle()).toEqual('Example Title');
        expect(environment.getSeniorTitle()).toEqual('Example Senior');
        expect(environment.getTimezone()).toEqual('Europe/London');
        expect(environment.getYear()).toEqual(2019);

        expect(sessionStorage.getItem).toHaveBeenCalledTimes(1);
        expect(sessionStorage.setItem).toHaveBeenCalledTimes(1);
    });

    it('should reflect the values of a valid environment from session storage', async () => {
        sessionStorage.setItem(EnvironmentImpl.kCacheName, JSON.stringify({
            eventName: 'Example Event',
            portalTitle: 'Example Title',
            seniorTitle: 'Example Senior',
            timezone: 'Europe/London',
            year: 2019
        }));

        const environment = createInstance(404, {});

        expect(await environment.initialize()).toBeTruthy();

        expect(environment.getEventName()).toEqual('Example Event');
        expect(environment.getPortalTitle()).toEqual('Example Title');
        expect(environment.getSeniorTitle()).toEqual('Example Senior');
        expect(environment.getTimezone()).toEqual('Europe/London');
        expect(environment.getYear()).toEqual(2019);

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

        expect(() => environment.getEventName()).toThrowError();
        expect(() => environment.getPortalTitle()).toThrowError();
        expect(() => environment.getSeniorTitle()).toThrowError();
        expect(() => environment.getTimezone()).toThrowError();
        expect(() => environment.getYear()).toThrowError();

        restoreConsole();
    });
});
