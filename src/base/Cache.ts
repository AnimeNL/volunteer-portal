// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { get, set } from 'idb-keyval';

/**
 * Provides the ability to cache arbitrary data within the browser cache. Jake's idb-keyval library
 * is used to abstract away the actual IndexedDB operations, which we further limit, e.g. key types.
 */
export class Cache {
    /**
     * Returns the value associated with the given |key|. An exception will be thrown when no data
     * has been associated with the given |key|.
     */
    async get(key: string): Promise<any> {
        const value = await get(key);
        if (value === undefined)
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
}
