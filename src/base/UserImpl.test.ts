// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { RestoreConsole, default as mockConsole } from 'jest-mock-console';
import { clear as kvClear } from 'idb-keyval';
import mockFetch from 'jest-fetch-mock';

import { UserImpl } from './UserImpl';

describe('UserImpl', () => {
    let restoreConsole: RestoreConsole | undefined = undefined;

    afterEach(() => restoreConsole!());
    beforeEach(async () => {
        // (1) Install the moacked console, to catch console.error() messages.
        restoreConsole = mockConsole();

        // (2) Clear the cache, as this test suite depends on validating caching behaviour.
        await kvClear();
    });

    it('should not allow state access before initialization', async () => {
        const user = new UserImpl();

        expect(user.authenticated).toBeFalsy();
        expect(() => user.authToken).toThrowError();
        expect(() => user.avatar).toThrowError();
        expect(() => user.name).toThrowError();
    });

    it('should allow for users to authenticate themselves across sessions', async () => {
        mockFetch.mockOnceIf('/api/auth', async request => ({
            body: JSON.stringify({ authToken: 'my-token' }),
            status: 200,
        }));

        mockFetch.mockOnceIf('/api/user?authToken=my-token', async request => ({
            body: JSON.stringify({
                administrator: false,
                events: { '2022-regular': 'Volunteer' },
                name: 'Volunteer Joe',
            }),
            status: 200,
        }));

        const user = new UserImpl();

        expect(user.authenticated).toBeFalsy();
        expect(await user.initialize()).toBeTruthy();
        expect(user.authenticated).toBeFalsy();

        expect(await user.authenticate({
            emailAddress: 'foo@example.com',
            accessCode: '1234'
        })).toBeTruthy();

        expect(user.authenticated).toBeTruthy();

        expect(user.accessCode).toEqual('1234');
        expect(user.authToken).toEqual('my-token');
        expect(user.avatar).toBeUndefined();
        expect(user.emailAddress).toEqual('foo@example.com');
        expect(user.events.get('2022-regular')).toEqual('Volunteer');
        expect(user.isAdministrator()).toBeFalsy();
        expect(user.name).toEqual('Volunteer Joe');

        const secondUser = new UserImpl();

        expect(secondUser.authenticated).toBeFalsy();
        expect(await secondUser.initialize()).toBeTruthy();
        expect(secondUser.authenticated).toBeTruthy();

        expect(secondUser.accessCode).toEqual(user.accessCode);
        expect(secondUser.authToken).toEqual(user.authToken);
        expect(secondUser.avatar).toEqual(user.avatar);
        expect(secondUser.emailAddress).toEqual(user.emailAddress);
        expect(secondUser.events).toEqual(user.events);
        expect(secondUser.isAdministrator()).toEqual(user.isAdministrator());
        expect(secondUser.name).toEqual(user.name);
    });

    it('should fail authentication when the returned token has expired', async () => {
        mockFetch.mockOnceIf('/api/auth', async request => ({
            body: JSON.stringify({
                authToken: 'my-token',
                authTokenExpiration: (Math.floor(Date.now() / 1000)) - 42,
            }),
            status: 200,
        }));

        const user = new UserImpl();

        expect(await user.initialize()).toBeTruthy();
        expect(user.authenticated).toBeFalsy();

        expect(await user.authenticate({
            emailAddress: 'foo@example.com',
            accessCode: '1234'
        })).toBeFalsy();

        expect(user.authenticated).toBeFalsy();
    });

    it('should fail authentication when the computer says no', async () => {
        mockFetch.mockOnceIf('/api/auth', async request => ({
            body: JSON.stringify({ /* empty response */ }),
            status: 200,
        }));

        const user = new UserImpl();

        expect(await user.initialize()).toBeTruthy();
        expect(user.authenticated).toBeFalsy();

        expect(await user.authenticate({
            emailAddress: 'foo@example.com',
            accessCode: '1234'
        })).toBeFalsy();

        expect(user.authenticated).toBeFalsy();
    });

    it('should fail authentication when the subsequent user request fails', async () => {
        mockFetch.mockOnceIf('/api/auth', async request => ({
            body: JSON.stringify({
                authToken: 'my-token',
                authTokenExpiration: (Math.floor(Date.now() / 1000)) - 42,
            }),
            status: 200,
        }));

        const user = new UserImpl();

        expect(await user.initialize()).toBeTruthy();
        expect(user.authenticated).toBeFalsy();

        expect(await user.authenticate({
            emailAddress: 'foo@example.com',
            accessCode: '1234'
        })).toBeFalsy();

        expect(user.authenticated).toBeFalsy();
    });

    it('should allow for signing out from the application', async () => {
        mockFetch.mockOnceIf('/api/auth', async request => ({
            body: JSON.stringify({ authToken: 'my-token' }),
            status: 200,
        }));

        mockFetch.mockOnceIf('/api/user?authToken=my-token', async request => ({
            body: JSON.stringify({
                administrator: false,
                events: { '2022-regular': 'Volunteer' },
                name: 'Volunteer Joe',
            }),
            status: 200,
        }));

        const user = new UserImpl();

        expect(await user.initialize()).toBeTruthy();
        expect(user.authenticated).toBeFalsy();

        expect(await user.authenticate({
            emailAddress: 'foo@example.com',
            accessCode: '1234'
        })).toBeTruthy();

        expect(user.authenticated).toBeTruthy();

        await user.signOut();

        expect(user.authenticated).toBeFalsy();

        const secondUser = new UserImpl();

        expect(await secondUser.initialize()).toBeTruthy();
        expect(secondUser.authenticated).toBeFalsy();
    });

    it('should allow for submitting an application to the server', async () => {
        mockFetch.mockOnceIf('/api/application?event=2022-regular', async request => ({
            body: JSON.stringify({ accessCode: '1234' }),
            status: 200,
        }));

        mockFetch.mockOnceIf('/api/auth', async request => ({
            body: JSON.stringify({ authToken: 'my-token' }),
            status: 200,
        }));

        mockFetch.mockOnceIf('/api/user?authToken=my-token', async request => ({
            body: JSON.stringify({
                administrator: false,
                events: { '2022-regular': 'Volunteer' },
                name: 'Volunteer Joe',
            }),
            status: 200,
        }));

        const user = new UserImpl();

        expect(await user.initialize()).toBeTruthy();
        expect(user.authenticated).toBeFalsy();

        expect(await user.submitApplication({
            // Identifier of the event for which an application is being made.
            event: '2022-regular',

            // Personal information:
            firstName: 'Joe',
            lastName: 'Volunteer',
            dateOfBirth: '2000-01-01',
            emailAddress: 'foo@example.com',
            phoneNumber: '+31600000000',
            gender: 'Any',
            shirtSize: 'L',

            // Participative information:
            commitmentHours: '12–16 hours',
            commitmentTiming: 'Regular (10:00–22:00)',
            preferences: 'None',

            available: true,
            credits: true,
            hotel: false,
            whatsApp: true,

            // Requirements:
            covidRequirements: true,
            gdprRequirements: true,

        })).toBeNull();

        expect(user.authenticated).toBeTruthy();

        expect(user.accessCode).toEqual('1234');
        expect(user.authToken).toEqual('my-token');
        expect(user.avatar).toBeUndefined();
        expect(user.emailAddress).toEqual('foo@example.com');
        expect(user.events.get('2022-regular')).toEqual('Volunteer');
        expect(user.isAdministrator()).toBeFalsy();
        expect(user.name).toEqual('Volunteer Joe');
    });
});
