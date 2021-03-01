// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { Cache } from './Cache';

// Parameters that must be given when initializing data through the cached loader.
interface CachedLoaderRequest<T> {
    // Name under which the data will be stored in the cache.
    cacheKey: string;

    // URL from which the data will be loaded from the network.
    url: string;

    // Function through which the untrusted |data| can be validated to contain the right format.
    validationFn: (data: any) => data is T;
}

// Provides the ability to simultaneously fetch data from the network and load it from cache, racing
// to resolve with whichever becomes available first. Implementation of stale-while-revalidate.
export class CachedLoader {
    private cache: Cache;

    constructor(cache: Cache) {
        this.cache = cache;
    }

    async initialize<T>(request: CachedLoaderRequest<T>): Promise<T | undefined> {
        let receivedFromNetwork = false;

        return Promise.any([
            // (1) Initialize the data from the cache, when available. This will likely finish first
            // when the cache has been populated, so be careful not to override existing data.
            this.initializeFromCache(request).then(data => {
                if (!receivedFromNetwork)
                    return data;
            }),

            // (2) Initialize the data from the network, when possible. Will override the cached
            // version for future loads, but will likely take more time to become available.
            this.initializeFromNetwork(request).then(async data => {
                // Store the obtained |environment| information in the cache. This gives us stale-
                // while-revalidate behaviour already. A change function could be called here.
                await this.cache.set(request.cacheKey, data);

                return data;
            }),

        // (3) If both fail, then we're offline and don't have a cached variant. Signal this to the
        // caller, which can handle this case as it sees appropriate.
        ]).catch(aggregateException => undefined);
    }

    /**
     * Initializes data information from the cache. As long as it's been cached once, this will
     * continue to work even without network connectivity.
     */
    async initializeFromCache<T>(request: CachedLoaderRequest<T>): Promise<T> {
        const data = await this.cache.get(request.cacheKey);

        if (!request.validationFn(data)) {
            await this.cache.delete(request.cacheKey);
            throw new TypeError( /* the cached data was invalid, and has been discarded */ );
        }

        return data;
    }

    /**
     * Initializes data information from the network. This will most likely take longer to load than
     * cached information (when it exists), but has the ability to update it.
     */
    async initializeFromNetwork<T>(request: CachedLoaderRequest<T>): Promise<T> {
        const response = await fetch(request.url);
        if (!response.ok)
            throw new Error(`Unable to fetch data from the server (${response.status}).`);

        const data = await response.json();
        if (!request.validationFn(data))
            throw new Error(`Cannot validate data received from the server.`);

        return data;
    }
}
