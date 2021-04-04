// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { clear, del, get, keys, set } from 'idb-keyval';

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
    async get(key: string): Promise<any> {
        return get(key);
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

    /**
     * Removes all data from the cache, without remorse or regrets. An exception could be thrown if
     * there is an error when writing to the underlying data store.
     */
    async clear(): Promise<void> {
        return clear();
    }
}
