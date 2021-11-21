// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import fetchMock from 'jest-fetch-mock';
import mockConsole from 'jest-mock-console';

import { ApiRequest } from './ApiRequest';

import { IContent } from '../api/IContent';
import { IEnvironment } from '../api/IEnvironment';

describe('ApiRequest', () => {
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
});
