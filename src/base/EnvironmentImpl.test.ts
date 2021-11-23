// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { RestoreConsole, default as mockConsole } from 'jest-mock-console';
import mockFetch from 'jest-fetch-mock';

import { Cache } from './Cache';
import { EnvironmentImpl } from './EnvironmentImpl';

describe('EnvironmentImpl', () => {
    let restoreConsole: RestoreConsole | undefined = undefined;

    afterEach(() => restoreConsole!());
    beforeEach(async () => {
        // (1) Install the moacked console, to catch console.error() messages.
        restoreConsole = mockConsole();

        // (2) Clear the cache, as this test suite depends on validating caching behaviour.
        await (new Cache).clear();
    });

    it('should reflect the values of a valid environment from the network', async () => {
        mockFetch.mockOnceIf('/api/environment', async request => ({
            body: JSON.stringify({
                title: 'Volunteer Portal',

                themeColor: '#ff0000',
                themeTitle: 'Voluntering Team',

                events: [
                    {
                        name: 'Event Name',
                        enableContent: true,
                        enableRegistration: true,
                        enableSchedule: false,
                        identifier: 'event-name',
                        website: 'https://example.com/'
                    }
                ],

                contactName: 'Peter',
            }),
            status: 200,
        }));

        const environment = new EnvironmentImpl();
        expect(await environment.initialize()).toBeTruthy();

        expect(environment.contactName).toEqual('Peter');
        expect(environment.contactTarget).toBeUndefined();
        expect(environment.title).toEqual('Volunteer Portal');

        expect(environment.themeColor).toEqual('#ff0000');
        expect(environment.themeTitle).toEqual('Voluntering Team');

        expect(environment.events).toHaveLength(1);
        expect(environment.events[0].name).toEqual('Event Name');
        expect(environment.events[0].enableContent).toBeTruthy();
        expect(environment.events[0].enableRegistration).toBeTruthy();
        expect(environment.events[0].enableSchedule).toBeFalsy();
        expect(environment.events[0].identifier).toEqual('event-name');
        expect(environment.events[0].website).toEqual('https://example.com/');
    });

    it('should fail when the API endpoint is unavailable', async () => {
        mockFetch.mockOnceIf('/api/environment', async request => ({
            status: 403,
        }));

        const environment = new EnvironmentImpl();
        expect(await environment.initialize()).toBeFalsy();

        expect(console.error).toHaveBeenCalledTimes(0);
        expect(() => environment.title).toThrowError();
    });
});
