// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { RestoreConsole, default as mockConsole } from 'jest-mock-console';

import mockFetch from 'jest-fetch-mock';

import { Cache } from './Cache';
import { ConfigurationImpl } from './ConfigurationImpl';
import { UserImpl } from './UserImpl';

describe('UserImpl', () => {
    let restoreConsole: RestoreConsole | undefined = undefined;

    beforeEach(() => restoreConsole = mockConsole());
    afterEach(() => restoreConsole!());

    /**
     * Creates an instance of the UserImpl object. Will return the configuration object used for
     * this instance as well as the UserImpl instance, so that mocked HTTP calls can be installed.
     */
    async function createInstance() {
        const cache = new Cache();
        const configuration = new ConfigurationImpl();
        const user = new UserImpl(configuration);

        await cache.delete(UserImpl.kAuthCacheKey);
        await cache.delete(UserImpl.kUserCacheKey);

        return { cache, configuration, user };
    }

    it('should not allow state access before initialization', async () => {
        const { user } = await createInstance();

        expect(user.authenticated).toBeFalsy();
        expect(() => user.authToken).toThrowError();
        expect(() => user.avatar).toThrowError();
        expect(() => user.name).toThrowError();
    });

    it('should fail authentication when HTTP errors occur, or invalid data is given', async () => {
        const { configuration, user } = await createInstance();

        mockFetch.mockOnceIf(configuration.getAuthenticationEndpoint(), async request => {
            return {
                status: /* not found= */ 404,
                body: JSON.stringify({ authToken: 'AuthToken' }),
            };
        });

        expect(await user.authenticate('user@example.com', '1234')).toBeFalsy();
        expect(user.authenticated).toBeFalsy();

        mockFetch.mockOnceIf(configuration.getAuthenticationEndpoint(), async request => {
            return {
                status: /* ok= */ 200,
                body: undefined,
            };
        });

        expect(await user.authenticate('user@example.com', '1234')).toBeFalsy();
        expect(user.authenticated).toBeFalsy();

        mockFetch.mockOnceIf(configuration.getAuthenticationEndpoint(), async request => {
            return {
                status: /* ok= */ 200,
                body: '~~ awesome token ~~',
            };
        });

        expect(await user.authenticate('user@example.com', '1234')).toBeFalsy();
        expect(user.authenticated).toBeFalsy();
    });

    it('should discard expired tokens obtained during authentication', async () => {
        const { configuration, user } = await createInstance();

        mockFetch.mockOnceIf(configuration.getAuthenticationEndpoint(), async request => {
            return {
                status: /* ok= */ 200,
                body: JSON.stringify({
                    authToken: 'AuthToken',
                    authTokenExpiration: Math.floor(Date.now() / 1000) - 42,
                }),
            };
        });

        expect(await user.authenticate('user@example.com', '1234')).toBeFalsy();
        expect(user.authenticated).toBeFalsy();
    });

    it('should fail authentication if the resulting user data is unavailable', async () => {
        const authToken = 'FakeAuthToken';
        const { configuration, user } = await createInstance();

        mockFetch.mockOnceIf(configuration.getAuthenticationEndpoint(), async request => {
            return {
                status: /* ok= */ 200,
                body: JSON.stringify({ authToken }),
            };
        });

        mockFetch.mockOnceIf(configuration.getUserEndpoint(authToken), async request => {
            return {
                status: /* server error= */ 501,
            }
        });

        expect(await user.authenticate('user@example.com', '1234')).toBeFalsy();
        expect(user.authenticated).toBeFalsy();
    });

    it('should succeed in authentication when all stars align', async () => {
        const authToken = 'FakeAuthToken';
        const { cache, configuration, user } = await createInstance();

        mockFetch.mockOnceIf(configuration.getAuthenticationEndpoint(), async request => {
            return {
                status: /* ok= */ 200,
                body: JSON.stringify({ authToken }),
            };
        });

        mockFetch.mockOnceIf(configuration.getUserEndpoint(authToken), async request => {
            return {
                status: /* ok= */ 200,
                body: JSON.stringify({
                    avatar: '/avatars/my-avatar.jpg',
                    events: { 'event-id': 'Rejected' },
                    name: 'My Name',
                })
            }
        });

        expect(await user.authenticate('user@example.com', '1234')).toBeTruthy();
        expect(user.authenticated).toBeTruthy();

        expect(user.accessCode).toEqual('1234');
        expect(user.authToken).toEqual(authToken);
        expect(user.avatar).toEqual('/avatars/my-avatar.jpg');
        expect(user.emailAddress).toEqual('user@example.com');
        expect(user.events.size).toEqual(1);
        expect(user.events.get('event-id')).toEqual('Rejected');
        expect(user.isAdministrator()).toBeFalsy();
        expect(user.name).toEqual('My Name');

        expect(await cache.has(UserImpl.kAuthCacheKey)).toBeTruthy();
        expect(await cache.has(UserImpl.kUserCacheKey)).toBeTruthy();
    });

    it('should gracefully fail initialization when no cache is available', async () => {
        const { user } = await createInstance();

        expect(await user.initialize()).toBeFalsy();
        expect(user.authenticated).toBeFalsy();
    });

    it('should succeed in initialization based on cached authentication data', async () => {
        const authToken = 'FakeAuthToken';
        const { cache, configuration, user } = await createInstance();

        mockFetch.mockOnceIf(configuration.getAuthenticationEndpoint(), async request => {
            return {
                status: /* ok= */ 200,
                body: JSON.stringify({ authToken }),
            };
        });

        mockFetch.mockOnceIf(configuration.getUserEndpoint(authToken), async request => {
            return {
                status: /* ok= */ 200,
                body: JSON.stringify({
                    administrator: true,
                    avatar: '/avatars/my-avatar.jpg',
                    events: { 'event-id': 'Registered' },
                    name: 'My Name',
                })
            }
        });

        expect(await user.authenticate('user@example.com', '1234')).toBeTruthy();
        expect(user.authenticated).toBeTruthy();

        expect(await cache.has(UserImpl.kAuthCacheKey)).toBeTruthy();
        expect(await cache.has(UserImpl.kUserCacheKey)).toBeTruthy();

        const secondUser = new UserImpl(configuration);
        expect(secondUser.authenticated).toBeFalsy();

        mockFetch.mockOnceIf(configuration.getUserEndpoint(authToken), async request => {
            return Promise.reject('There is no internet connection!');
        });

        expect(await secondUser.initialize()).toBeTruthy();

        expect(secondUser.authToken).toEqual(authToken);
        expect(secondUser.avatar).toEqual('/avatars/my-avatar.jpg');
        expect(secondUser.events.size).toEqual(1);
        expect(secondUser.events.get('event-id')).toEqual('Registered');
        expect(secondUser.isAdministrator()).toBeTruthy();
        expect(secondUser.name).toEqual('My Name');
    });

    it('should be possible to sign users out', async () => {
        const authToken = 'FakeAuthToken';
        const { cache, configuration, user } = await createInstance();

        mockFetch.mockOnceIf(configuration.getAuthenticationEndpoint(), async request => {
            return {
                status: /* ok= */ 200,
                body: JSON.stringify({ authToken }),
            };
        });

        mockFetch.mockOnceIf(configuration.getUserEndpoint(authToken), async request => {
            return {
                status: /* ok= */ 200,
                body: JSON.stringify({
                    name: 'My Name',
                    events: {},
                })
            }
        });

        expect(await user.authenticate('user@example.com', '1234')).toBeTruthy();
        expect(user.authenticated).toBeTruthy();

        expect(await cache.has(UserImpl.kAuthCacheKey)).toBeTruthy();
        expect(await cache.has(UserImpl.kUserCacheKey)).toBeTruthy();

        await user.signOut();

        expect(user.authenticated).toBeFalsy();

        expect(await cache.has(UserImpl.kAuthCacheKey)).toBeFalsy();
        expect(await cache.has(UserImpl.kUserCacheKey)).toBeFalsy();
    });
});
