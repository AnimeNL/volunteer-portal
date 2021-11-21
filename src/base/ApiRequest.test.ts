// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import fetchMock from 'jest-fetch-mock';
import mockConsole from 'jest-mock-console';

import { ApiRequest } from './ApiRequest';

import { IAuth } from '../api/IAuth';
import { IContent } from '../api/IContent';
import { IEnvironment } from '../api/IEnvironment';

describe('ApiRequest', () => {
    it('is able to issue and validate requests for IAuth', async () => {
        const kValidAuthResponse = {
            authToken: 'auth-token-1234',
        };

        // (1) Valid authentication response
        {
            fetchMock.mockOnceIf('/api/auth', async request => ({
                body: JSON.stringify(kValidAuthResponse),
                status: 200,
            }));

            const request = new ApiRequest<IAuth>('IAuth');
            const response = await request.issue({
                emailAddress: 'foo@example.com',
                accessCode: '1234',
            });

            expect(request.api).toEqual('IAuth');
            expect(response).toEqual(kValidAuthResponse);
        }

        const kValidEmptyAuthResponse = {};

        // (2) Valid empty authentication response
        {
            fetchMock.mockOnceIf('/api/auth', async request => ({
                body: JSON.stringify(kValidEmptyAuthResponse),
                status: 200,
            }));

            const request = new ApiRequest<IAuth>('IAuth');
            const response = await request.issue({
                emailAddress: 'foo@example.com',
                accessCode: '1235',
            });

            expect(response).toEqual(kValidEmptyAuthResponse);
        }

        // (3) Invalid authentication response (non-ok response code)
        {
            fetchMock.mockOnceIf('/api/auth', async request => ({
                status: 403,
            }));

            const request = new ApiRequest<IAuth>('IAuth');
            await expect(() => request.issue({
                emailAddress: 'foo@example.com',
                accessCode: '1234',
            })).rejects.toThrow();
        }

        const kInvalidAuthResponse = {
            authToken: 'auth-token-1234',
            authTokenExpiration: null,  // should be a number
        };

        // (4) Invalid authentication response (incomplete response)
        {
            fetchMock.mockOnceIf('/api/auth', async request => ({
                body: JSON.stringify(kInvalidAuthResponse),
                status: 200,
            }));

            const restoreConsole = mockConsole();
            const request = new ApiRequest<IAuth>('IAuth');

            await expect(() => request.issue({
                emailAddress: 'foo@example.com',
                accessCode: '1234',
            })).rejects.toThrow();

            expect(console.error).toHaveBeenCalledTimes(1);
            restoreConsole();
        }

        // (5) Availability of the POST variables in the request body
        {
            fetchMock.mockOnceIf('/api/auth', async request => {
                expect(request.method).toEqual('POST');
                expect(request.bodyUsed).toBeFalsy();

                // TODO: Test that the `emailAddress` and `accessCode` values are included in the
                // |request|. It looks like jest-fetch-mock doesn't support FormData structures and
                // ends up stringifying them instead ("[object FormData]").
                //
                // @see https://github.com/jefflau/jest-fetch-mock/issues/23

                return {
                    body: JSON.stringify(kValidEmptyAuthResponse),
                    status: 200,
                };
            });

            const request = new ApiRequest<IAuth>('IAuth');
            const response = await request.issue({
                emailAddress: 'foo@example.com',
                accessCode: '1235',
            });

            expect(response).toEqual(kValidEmptyAuthResponse);
        }
    });

    it('is able to issue and validate requests for IContent', async () => {
        const kValidEmptyContent = {
            pages: [],
        };

        // (1) Valid empty content response
        {
            fetchMock.mockOnceIf('/api/content', async request => ({
                body: JSON.stringify(kValidEmptyContent),
                status: 200,
            }));

            const request = new ApiRequest<IContent>('IContent');
            const response = await request.issue();

            expect(request.api).toEqual('IContent');
            expect(response).toEqual(kValidEmptyContent);
        }

        const kValidContent = {
            pages: [
                {
                    pathname: '/index.html',
                    content: 'Hello, world!',
                    modified: 1451606400,
                }
            ],
        };

        // (2) Valid non-empty content response
        {
            fetchMock.mockOnceIf('/api/content', async request => ({
                body: JSON.stringify(kValidContent),
                status: 200,
            }));

            const request = new ApiRequest<IContent>('IContent');
            const response = await request.issue();

            expect(response).toEqual(kValidContent);
        }

        // (3) Invalid content response (non-ok response code)
        {
            fetchMock.mockOnceIf('/api/content', async request => ({
                status: 403,
            }));

            const request = new ApiRequest<IContent>('IContent');
            await expect(() => request.issue()).rejects.toThrow();
        }

        const kInvalidContent = {
            pages: [
                {
                    pathname: 'index.html',  // must match pattern "^/"
                    content: 'Hello, world!',
                    modified: 1451606400,
                }
            ]
        };

        // (4) Invalid content response (incomplete response)
        {
            fetchMock.mockOnceIf('/api/content', async request => ({
                body: JSON.stringify(kInvalidContent),
                status: 200,
            }));

            const restoreConsole = mockConsole();
            const request = new ApiRequest<IContent>('IContent');

            await expect(() => request.issue()).rejects.toThrow();

            expect(console.error).toHaveBeenCalledTimes(1);
            restoreConsole();
        }
    });

    it('is able to issue and validate requests for IEnvironment', async () => {
        const kValidEnvironment = {
            title: 'My Environment',

            themeColor: '#ff0000',
            themeTitle: 'Environment',

            events: [
                {
                    name: 'My Event',
                    enableContent: true,
                    enableRegistration: true,
                    enableSchedule: false,
                    identifier: 'my-event',
                    timezone: 'Europe/Amsterdam',
                    website: 'https://my-event.com',
                }
            ],

            contactName: 'Administrator',
            contactTarget: 'mailto:info@example.com',
        };

        // (1) Valid environment response
        {
            fetchMock.mockOnceIf('/api/environment', async request => ({
                body: JSON.stringify(kValidEnvironment),
                status: 200,
            }));

            const request = new ApiRequest<IEnvironment>('IEnvironment');
            const response = await request.issue();

            expect(request.api).toEqual('IEnvironment');
            expect(response).toEqual(kValidEnvironment);
        }

        // (2) Invalid environment response (non-ok response code)
        {
            fetchMock.mockOnceIf('/api/environment', async request => ({
                status: 403,
            }));

            const request = new ApiRequest<IEnvironment>('IEnvironment');
            await expect(() => request.issue()).rejects.toThrow();
        }

        const kInvalidEnvironment = {
            title: false,
        };

        // (3) Invalid environment response (incomplete response)
        {
            fetchMock.mockOnceIf('/api/environment', async request => ({
                body: JSON.stringify(kInvalidEnvironment),
                status: 200,
            }));

            const restoreConsole = mockConsole();
            const request = new ApiRequest<IEnvironment>('IEnvironment');

            await expect(() => request.issue()).rejects.toThrow();

            expect(console.error).toHaveBeenCalledTimes(1);
            restoreConsole();
        }
    });

    it('allows requests to be aborted using the AbortController', async() => {
        jest.useFakeTimers();

        const controller = new AbortController();
        const request = new ApiRequest<IContent>('IContent');

        fetchMock.mockOnceIf('/api/content', async request => {
            jest.advanceTimersByTime(/* msToRun= */ 150);
            return JSON.stringify({ pages: [] });
        });

        setTimeout(() => controller.abort(), /* ms= */ 100);
        await expect(() => request.issue(undefined, controller.signal)).rejects.toThrow();
    });
});
