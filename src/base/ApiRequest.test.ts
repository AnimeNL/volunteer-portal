// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import fetchMock from 'jest-fetch-mock';

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

        fetchMock.mockOnceIf('/api/environment', async request => ({
            body: JSON.stringify(kValidEnvironment),
            status: 200,
        }));

        const request = new ApiRequest<IEnvironment>('IEnvironment');
        const response = await request.issue();

        expect(response).toEqual(kValidEnvironment);
    });
});
