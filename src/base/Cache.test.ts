// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { Cache } from './Cache';

describe('Cache', () => {
    it('throws when attempting to read non-existing content', async() => {
        const cache = new Cache();

        expect.assertions(1);
        try {
            await cache.get('non-existing-key');
        } catch (exception) {
            expect(exception.message).toMatch(
                'No data has been cached for key "non-existing-key" yet.');
        }
    });

    it('has the ability to store any type of content, and reflect it', async() => {
        const cache = new Cache();

        // Arrays
        await cache.set('my-array', [ 1, 3, 5 ]);
        expect(await cache.get('my-array')).toStrictEqual([ 1, 3, 5 ]);

        // Booleans
        await cache.set('my-boolean', true);
        expect(await cache.get('my-boolean')).toBeTruthy();

        // Numbers
        await cache.set('my-number', 42);
        expect(await cache.get('my-number')).toStrictEqual(42);

        // Objects
        await cache.set('my-object', { a: 'foo', bar: [ true ] });
        expect(await cache.get('my-object')).toStrictEqual({ a: 'foo', bar: [ true ] });

        // Strings
        await cache.set('my-string', 'Hello, world!');
        expect(await cache.get('my-string')).toEqual('Hello, world!');
    });

    it('has the ability to delete stored data', async() => {
        const cache = new Cache();

        await cache.set('foo', 'bar');
        expect(await cache.get('foo')).toEqual('bar');

        await cache.delete('foo');

        try {
            await cache.get('foo');
        } catch (exception) {
            expect(exception.message).toMatch('No data has been cached for key "foo" yet.');
        }
    });

    it('has the ability to store content across instances', async() => {
        const firstCache = new Cache();
        const secondCache = new Cache();

        await firstCache.set('my-content', 'value');
        expect(await secondCache.get('my-content')).toEqual('value');
    });
});
