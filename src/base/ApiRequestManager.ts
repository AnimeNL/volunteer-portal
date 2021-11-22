// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import type { ApiName, ApiRequestType, ApiResponseType } from './ApiName';
import { ApiRequest } from './ApiRequest';

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
// access (offline enabled) and timed updates in case the application is long living without reload.
export class ApiRequestManager<K extends ApiName> {
    private abortController?: AbortController;
    private request: ApiRequest<K>;
    private observer: ApiRequestObserver<K>;

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

        // TODO: Enable caching of responses, but ignore for later requests.
        // TODO: Enable responses to be automatically re-issued after a predefined period of time?

        this.abortController = new AbortController();

        let response: ApiResponseType<K> | undefined;

        try {
            response = await this.request.issue(request, this.abortController.signal);
        } catch (error) {
            const typedError = error instanceof Error ? error : new Error(`Error: ${error}`);
            if (typedError.name === 'AbortError') {
                // AbortError is thrown when we invalidate the signal from a previous request using
                // the AbortController. This is intentional, and is not considered a failure.
                return false;
            }

            await this.observer.onFailedResponse(typedError);
            return false;
        }

        await this.observer.onSuccessResponse(response);
        return true;
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
