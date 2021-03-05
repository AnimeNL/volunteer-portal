// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { RestoreConsole, default as mockConsole } from 'jest-mock-console';
import mockFetch from 'jest-fetch-mock';

import moment from 'moment-timezone';

import { Cache } from './Cache';
import { ConfigurationImpl } from './ConfigurationImpl';
import { ContentImpl } from './ContentImpl';

describe('ContentImpl', () => {
    let restoreConsole: RestoreConsole | undefined = undefined;

    beforeEach(() => restoreConsole = mockConsole());
    afterEach(() => restoreConsole!());

    /**
     * Creates an instance of the ContentImpl object. The |content| will be served through mocked
     * HTTP fetches, with the appropriate response being given.
     *
     * @param status The HTTP status code the mock server should respond with.
     * @param content The content that should be returned by the mock server.
     */
    async function createInstance(status: number, content: object) {
        const cache = new Cache();
        const configuration = new ConfigurationImpl();

        // Always clear the cache prior to creating a new instance.
        await cache.delete(ContentImpl.kCacheKey);

        mockFetch.mockOnceIf(configuration.getContentEndpoint(), async request => {
            return {
                body: JSON.stringify(content),
                status,
            };
        });

        return {
            cache,
            content: new ContentImpl(cache, configuration)
        };
    }

    it('should reflect the values of a valid content from the network', async () => {
        const { cache, content } = await createInstance(200, {
            pages: [
                {
                    pathname: '/foo',
                    content: 'Foo!',
                    modified: 0,
                },
                {
                    pathname: '/bar',
                    content: 'Bar?',
                    modified: 42,
                }
            ]
        });

        expect(await cache.has(ContentImpl.kCacheKey)).toBeFalsy();
        expect(await content.initialize()).toBeTruthy();

        expect(content.has('/foo')).toBeTruthy();
        expect(content.get('/foo')?.pathname).toEqual('/foo');
        expect(content.get('/foo')?.content).toEqual('Foo!');
        expect(content.get('/foo')?.modified).toEqual(moment.utc(0));

        expect(content.has('/bar')).toBeTruthy();
        expect(content.get('/bar')?.pathname).toEqual('/bar');
        expect(content.get('/bar')?.content).toEqual('Bar?');
        expect(content.get('/bar')?.modified).toEqual(moment.utc(42));

        expect(content.has('/baz')).toBeFalsy();

        expect(await cache.has(ContentImpl.kCacheKey)).toBeTruthy();
    });

    it('should reflect the values of a valid content from the cache', async () => {
        const { cache, content } = await createInstance(404, {});

        await cache.set(ContentImpl.kCacheKey, {
            pages: [
                {
                    pathname: '/baz',
                    content: 'Baz!',
                    modified: 42,
                }
            ]
        });

        expect(await cache.has(ContentImpl.kCacheKey)).toBeTruthy();
        expect(await content.initialize()).toBeTruthy();

        expect(content.has('/foo')).toBeFalsy();
        expect(content.has('/bar')).toBeFalsy();

        expect(content.has('/baz')).toBeTruthy();
        expect(content.get('/baz')?.pathname).toEqual('/baz');
        expect(content.get('/baz')?.content).toEqual('Baz!');
        expect(content.get('/baz')?.modified).toEqual(moment.utc(42));
    });

    it('should fail when the API endpoint is unavailable', async () => {
        const { content } = await createInstance(404, {});

        // Failure because fetching the API endpoint returns a 404 status.
        expect(await content.initialize()).toBeFalsy();
        expect(console.error).toHaveBeenCalledTimes(0);
    });

    it('should fail when the API endpoint returns invalid data', async () => {
        const { content } = await createInstance(200, { fruit: 'banana' });

        // Failure because data fetched from the API endpoint does not match [[IContentResponse]].
        expect(await content.initialize()).toBeFalsy();
        expect(console.error).toHaveBeenCalledTimes(1);
    });

    it('should throw when accessing properties before a successful initialization', async () => {
        const { content } = await createInstance(404, {});

        expect(await content.initialize()).toBeFalsy();
        expect(() => content.has('foo')).toThrowError();
        expect(() => content.get('baz')).toThrowError();
    });

    it('should be able to return prefixed paths in length order', async () => {
        const { cache, content } = await createInstance(200, {
            pages: [
                {
                    pathname: '/foo/',
                    content: 'Foo Index',
                    modified: 0,
                },
                {
                    pathname: '/foo/bar.html',
                    content: 'Bar!',
                    modified: 42,
                }
            ]
        });

        expect(await cache.has(ContentImpl.kCacheKey)).toBeFalsy();
        expect(await content.initialize()).toBeTruthy();

        expect(content.has('/foo/')).toBeTruthy();
        expect(content.has('/foo/bar.html')).toBeTruthy();

        expect(content.getPrefixed('/foo/')).toHaveLength(2);
        expect(content.getPrefixed('/foo/')).toStrictEqual([
            {
                pathname: '/foo/bar.html',
                content: 'Bar!',
                modified: moment.utc(42),
            },
            {
                pathname: '/foo/',
                content: 'Foo Index',
                modified: moment.utc(0),
            }
        ]);
    });
});
