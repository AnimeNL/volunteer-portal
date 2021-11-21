// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import fetchMock from 'jest-fetch-mock';
import mockConsole from 'jest-mock-console';

import { ApiRequest } from './ApiRequest';
import { IEnvironment } from '../api/IEnvironment';

describe('ApiRequest', () => {
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
