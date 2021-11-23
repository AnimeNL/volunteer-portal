// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { RestoreConsole, default as mockConsole } from 'jest-mock-console';
import mockFetch from 'jest-fetch-mock';

import moment from 'moment-timezone';

import { Cache } from './Cache';
import { ContentImpl } from './ContentImpl';

describe('ContentImpl', () => {
    let restoreConsole: RestoreConsole | undefined = undefined;

    afterEach(() => restoreConsole!());
    beforeEach(async () => {
        // (1) Install the moacked console, to catch console.error() messages.
        restoreConsole = mockConsole();

        // (2) Clear the cache, as this test suite depends on validating caching behaviour.
        await (new Cache).clear();
    });

    it('should reflect the values of a valid content from the network', async () => {
        const currentTime = moment.utc().unix();

        mockFetch.mockOnceIf('/api/content', async request => ({
            body: JSON.stringify({
                pages: [
                    {
                        pathname: '/foo',
                        content: 'Foo!',
                        modified: currentTime,
                    },
                    {
                        pathname: '/bar',
                        content: 'Bar?',
                        modified: currentTime + 30,
                    }
                ],
            }),
            status: 200,
        }));

        const content = new ContentImpl();
        expect(await content.initialize()).toBeTruthy();

        expect(content.has('/foo')).toBeTruthy();
        expect(content.get('/foo')?.pathname).toEqual('/foo');
        expect(content.get('/foo')?.content).toEqual('Foo!');
        expect(content.get('/foo')?.modified).toEqual(moment.utc(currentTime));

        expect(content.has('/bar')).toBeTruthy();
        expect(content.get('/bar')?.pathname).toEqual('/bar');
        expect(content.get('/bar')?.content).toEqual('Bar?');
        expect(content.get('/bar')?.modified).toEqual(moment.utc(currentTime + 30));

        expect(content.has('/baz')).toBeFalsy();
    });

    it('should fail when the API endpoint is unavailable', async () => {
        mockFetch.mockOnceIf('/api/content', async request => ({
            status: 404,
        }));

        const content = new ContentImpl();
        expect(await content.initialize()).toBeFalsy();

        expect(console.error).toHaveBeenCalledTimes(0);

        expect(() => content.has('foo')).toThrowError();
        expect(() => content.get('baz')).toThrowError();
    });

    it('should be able to return prefixed paths in length order', async () => {
        const currentTime = moment.utc().unix();

        mockFetch.mockOnceIf('/api/content', async request => ({
            body: JSON.stringify({
                pages: [
                    {
                        pathname: '/foo/',
                        content: 'Foo Index',
                        modified: currentTime,
                    },
                    {
                        pathname: '/foo/bar.html',
                        content: 'Bar!',
                        modified: currentTime + 30,
                    }
                ]
            }),
            status: 200,
        }));

        const content = new ContentImpl();
        expect(await content.initialize()).toBeTruthy();

        expect(content.has('/foo/')).toBeTruthy();
        expect(content.has('/foo/bar.html')).toBeTruthy();

        expect(content.getPrefixed('/foo/')).toHaveLength(2);
        expect(content.getPrefixed('/foo/')).toStrictEqual([
            {
                pathname: '/foo/bar.html',
                content: 'Bar!',
                modified: moment.utc(currentTime + 30),
            },
            {
                pathname: '/foo/',
                content: 'Foo Index',
                modified: moment.utc(currentTime),
            }
        ]);
    });
});
