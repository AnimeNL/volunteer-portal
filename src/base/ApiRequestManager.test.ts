// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { RestoreConsole, default as mockConsole } from 'jest-mock-console';
import fetchMock from 'jest-fetch-mock';

import { ApiRequestManager } from './ApiRequestManager';

import { IAuth, IAuthResponse } from '../api/IAuth';
import { IContent, IContentResponse } from '../api/IContent';
import { IEvent, IEventResponse } from '../api/IEvent';

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
        const requestManager = new ApiRequestManager('IContent', new class {
            onFailedResponse(error?: Error) {
                throw new Error('The `onFailedResponse` callback was unexpectedly invoked.');
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
        const requestManager = new ApiRequestManager('IContent', new class {
            onFailedResponse(error: Error) {
                errors.push(error);
            }
            onSuccessResponse(response: IContentResponse) {
                throw new Error('The `onSuccessResponse` callback was unexpectedly invoked.');
            }
        });

        expect(await requestManager.issue()).toBeFalsy();

        expect(errors).toHaveLength(1);
        expect(errors[0].message).toEqual('Unable to fetch data from the server (403).');
    });

    it('ensures that only a single response is in progress at once', async () => {
        jest.useFakeTimers();

        fetchMock.mockIf('/api/content', async request => {
            jest.advanceTimersByTime(/* msToRun= */ 150);
            return JSON.stringify({ pages: [] });
        });

        let responseCount = 0;

        const requestManager = new ApiRequestManager('IContent', new class {
            onFailedResponse(error: Error) {
                // Note that AbortError instances are suppressed when considering to invoke the
                // onFailedResponse callback, as they're a direct consequence of our design.
                throw new Error('The `onFailedResponse` callback was unexpectedly invoked.');
            }
            onSuccessResponse(response: IContentResponse) {
                responseCount++;
            }
        });

        const promii: Promise<boolean>[] = [];
        const waitPromise = new Promise<boolean>(resolve => {
            setTimeout(() => resolve(requestManager.issue()), 100);
        });

        promii.push(requestManager.issue());
        promii.push(waitPromise);

        expect(await Promise.all(promii)).toEqual([ false, true ]);
        expect(responseCount).toEqual(1);
    });

    it('has the ability to determine whether a request is cacheable', async () => {
        const authRequestManager = new ApiRequestManager('IAuth', new class {
            onFailedResponse(error: Error) {
                throw new Error('The `onFailedResponse` callback was unexpectedly invoked.');
            }
            onSuccessResponse(response: IAuthResponse) {
                throw new Error('The `onSuccessResponse` callback was unexpectedly invoked.');
            }
        });

        expect(authRequestManager.determineCacheKey({
            emailAddress: 'foo@example.com',
            accessCode: '1234',
        })).toBeUndefined();

        const contentRequestManager = new ApiRequestManager('IContent', new class {
            onFailedResponse(error: Error) {
                throw new Error('The `onFailedResponse` callback was unexpectedly invoked.');
            }
            onSuccessResponse(response: IContentResponse) {
                throw new Error('The `onSuccessResponse` callback was unexpectedly invoked.');
            }
        });

        expect(contentRequestManager.determineCacheKey()).toEqual('IContent');

        const eventRequestManager = new ApiRequestManager('IEvent', new class {
            onFailedResponse(error: Error) {
                throw new Error('The `onFailedResponse` callback was unexpectedly invoked.');
            }
            onSuccessResponse(response: IEventResponse) {
                throw new Error('The `onSuccessResponse` callback was unexpectedly invoked.');
            }
        });

        expect(eventRequestManager.determineCacheKey({ authToken: 'AT', event: 'EVT' }))
            .toEqual('IEvent-AT-EVT');

        expect(eventRequestManager.determineCacheKey({ event: 'EVT', authToken: 'AT' }))
            .toEqual('IEvent-AT-EVT');
    });
});
