// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { del, get, keys, set } from 'idb-keyval';

/**
 * Provides the ability to cache arbitrary data within the browser cache. Jake's idb-keyval library
 * is used to abstract away the actual IndexedDB operations, which we further limit, e.g. key types.
 */
export class Cache {
    /**
     * Returns whether the given |key| exists in the cache. This is a fairly expensive operation for
     * what it does, so using get() and checking for an exception is preferred.
     */
    async has(key: string): Promise<boolean> {
        return (await keys()).includes(key);
    }

    /**
     * Returns the value associated with the given |key|.
     */
    async get(key: string, allowUndefined: boolean = false): Promise<any> {
        const value = await get(key);
        if (!allowUndefined && value === undefined)
            throw new Error(`No data has been cached for key "${key}" yet.`);

        return value;
    }

    /**
     * Associates the given |value| with the given |key|. Note that an exception could be thrown
     * when issues are seen while writing to the underlying data store.
     */
    async set(key: string, value: any): Promise<void> {
        return set(key, value);
    }

    /**
     * Removes any data associated with the given |key| from the database. Note that an exception
     * could be thrown when issues are seen while writing to the underlying data store.
     */
    async delete(key: string): Promise<void> {
        return del(key);
    }
}
