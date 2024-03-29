// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { getMany as kvGetMany, setMany as kvSetMany } from 'idb-keyval';

import type { ApiName, ApiRequestType, ApiResponseType } from './ApiName';
import { ApiRequest } from './ApiRequest';
import { validate } from './ApiValidator';

// Suffix appended to cache keys using which the content hash has been stored.
const kHashCacheKeySuffix = '__hash';

// Observer interface that users of the ApiRequestManager have to implement, which is used to inform
// the user about successful or failed requests issued to the API. Return values have been removed
// from the asynchronous methods to prevent misuse.
export interface ApiRequestObserver<K extends ApiName> {
    // Called when an issued request has failed, and could not be completed. When available, the
    // |error| will be included with more information. Diagnostics will be shared to the console.
    onFailedResponse: (error: Error) => Promise<void> | void;

    // Called when an issued request has succeeded. The |response| is the full, validated response
    // in accordance with the response type defined by the API. May be called multiple times during
    // the application's lifetime, in case multiple responses are being issued.
    onSuccessResponse: (response: ApiResponseType<K>) => Promise<void> | void;
}

// The ApiRequestManager abstracts over the ApiRequest by enabling direct access, as well as cached
// access (offline enabled) for requests that support such functionality, which do not rely on POST.
export class ApiRequestManager<K extends ApiName> {
    private abortController?: AbortController;

    private request: ApiRequest<K>;
    private observer: ApiRequestObserver<K>;

    private previousResponseHash?: number;

    constructor(api: K, observer: ApiRequestObserver<K>) {
        this.request = new ApiRequest(api);
        this.observer = observer;
    }

    // Issues a request on the API. The |request| is conditionally required if the |T| defines the
    // required request parameters. This method will resolve with a boolean indicating success,
    // which will happen *after* any attached ApiRequestObserver(s) will have been informed. Any
    // previous requests that were in progress will be immediately aborted.
    async issue(request: ApiRequestType<K>): Promise<boolean> {
        if (this.abortController)
            this.abortController.abort();

        const abortController = new AbortController();
        this.abortController = abortController;

        const cacheKey = this.determineCacheKey(request);
        const considerCache = cacheKey && !this.previousResponseHash;

        try {
            let responded = false;

            const [ responseHash, response ] = await Promise.any([
                // (1) Issue the request to the network. When successful, and caching is available,
                // immediately store the response value to the local cache as well.
                this.request.issue(request, abortController.signal).then(async response => {
                    if (cacheKey && this.request.hash !== this.previousResponseHash)
                        await this.storeInCache(cacheKey, this.request.hash, response);

                    if (responded)
                        await this.maybeNotifySuccessResponse(this.request.hash, response);

                    return [ this.request.hash, response ];
                }),

                // (2) When available, issue a request to load the response from the local cache.
                // In most cases this will resolve first, but that is not guaranteed.
                considerCache ? this.requestFromCache(cacheKey) : Promise.reject()
            ]);

            responded = true;  // avoids double-invoking `onSuccessResponse` for no reason

            // FIXME: TypeScript is incorrectly detecting the types of the two possible return
            // promises in the `Promise.any` call above, causing us to need a cast here.
            await this.maybeNotifySuccessResponse(
                responseHash as number, response as ApiResponseType<K>);

            return true;

        } catch (aggregateError) {
            let error: Error;

            // (1) Determine the exact |error| that happened. This should be an AggregateError
            // thrown by Promise.any(), but caching behaviour may throw different errors.
            if (aggregateError instanceof AggregateError && aggregateError.errors.length > 0)
                error = aggregateError.errors[0];
            else if (aggregateError instanceof Error)
                error = aggregateError as Error;
            else
                error = new Error(`Error: ${aggregateError}`);

            // AbortError is thrown when we invalidate the signal from a previous request using the
            // AbortController. This is intentional, and is not considered a failure.
            if (error.name === 'AbortError' && abortController.signal.aborted)
                return false;

            await this.observer.onFailedResponse(error);
            return false;

        } finally {
            this.abortController = undefined;
        }
    }

    // Notifies observers about the given |response|, unless its contents have not changed from the
    // previous notification that was issued. In that case we silently ignore the (valid) response.
    async maybeNotifySuccessResponse(responseHash: number, response: ApiResponseType<K>): Promise<void> {
        if (typeof response === 'object') {
            if (responseHash === this.previousResponseHash)
                return;  // the response data hasn't been invalidated

            this.previousResponseHash = responseHash;
        }

        await this.observer.onSuccessResponse(response);
    }

    // Requests the given |cacheKey| from the local cache, expecting a response appropriate to the
    // current API. The response will be validated prior to being returned. Will throw an exception
    // when either the |cacheKey| does not have any associated data, or that data does not validate.
    async requestFromCache(cacheKey: string): Promise<[ number, ApiResponseType<K> ]> {
        const [ responseHash, responseData ] = await kvGetMany([
            cacheKey + kHashCacheKeySuffix,
            cacheKey,
        ])

        if (!responseHash || !responseData)
            throw new Error('No response data has been cached for this request.');

        if (!validate<ApiResponseType<K>>(responseData, `${this.request.api}Response`))
            throw new Error('Unable to validate the fetched data from the local cache.');

        return [ responseHash, responseData ];
    }

    // Stores the given |response| in the local cache, keyed by the given |cacheKey|. The response
    // hash will be stored as well, allowing us to avoid unnecessary invalidations.
    async storeInCache(cacheKey: string, hash: number, response: ApiResponseType<K>): Promise<void> {
        await kvSetMany([
            [ cacheKey + kHashCacheKeySuffix, hash ],
            [ cacheKey, response ],
        ]);
    }

    // Determines the cache key for the given |request|. When a string is returned, the request is
    // deemed cacheable. In other cases the request (& associated response) cannot be cached, which
    // usually happens because non-trivial amounts of data are being uploaded.
    determineCacheKey(request: ApiRequestType<K>): string | undefined {
        const composition: string[] = [ this.request.api ];
        if (typeof request === 'object') {
            // Note that sorting the |request|'s keys is significant, to ensure that composition
            // parameters will be added to the cache key composition in a consistent order.
            for (const key of Object.keys(request as object).sort()) {
                switch (key) {
                    case 'authToken':
                    case 'event':
                        composition.push((request as any)[key]);
                        break;

                    default:
                        // One of the |request|'s parameters is not considered a request parameter,
                        // so therefore we're unable to cache this request.
                        return;
                }
            }
        }

        return composition.join('-');
    }
}
