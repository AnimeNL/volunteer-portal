// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { RestoreConsole, default as mockConsole } from 'jest-mock-console';
import fetchMock from 'jest-fetch-mock';

import { ApiRequestManager } from './ApiRequestManager';

import { IContent, IContentResponse } from '../api/IContent';

describe('ApiRequestManager', () => {
    let restoreConsole: RestoreConsole | undefined = undefined;

    beforeEach(() => restoreConsole = mockConsole());
    afterEach(() => restoreConsole!());

    it('is able to issue requests and receive successful responses', async () => {
        const kValidContentResponse = {
            pages: [
                {
                    pathname: '/index.html',
                    content: 'Hello, world!',
                    modified: 1451606400,
                }
            ]
        };

        fetchMock.mockIf('/api/content', async request => ({
            body: JSON.stringify(kValidContentResponse),
            status: 200,
        }));

        const responses: IContentResponse[] = [];
        const requestManager = new ApiRequestManager<IContent>('IContent', new class {
            onFailedResponse(error?: Error) {
                fail('The `onFailedResponse` callback was unexpectedly invoked.');
            }
            onSuccessResponse(response: IContentResponse) {
                responses.push(response);
            }
        });

        expect(await requestManager.issue()).toBeTruthy();

        expect(responses).toHaveLength(1);
        expect(responses[0]).toEqual(kValidContentResponse);

        expect(await requestManager.issue()).toBeTruthy();

        expect(responses).toHaveLength(2);
        expect(responses[1]).toEqual(kValidContentResponse);
    });


    it('is able to issue requests and receive failed responses', async () => {
        fetchMock.mockIf('/api/content', async request => ({
            status: 403,
        }));

        const errors: Error[] = [];
        const requestManager = new ApiRequestManager<IContent>('IContent', new class {
            onFailedResponse(error: Error) {
                errors.push(error);
            }
            onSuccessResponse(response: IContentResponse) {
                fail('The `onSuccessResponse` callback was unexpectedly invoked.');
            }
        });

        expect(await requestManager.issue()).toBeFalsy();

        expect(errors).toHaveLength(1);
        expect(errors[0].message).toEqual('Unable to fetch data from the server (403).');
    });
});
