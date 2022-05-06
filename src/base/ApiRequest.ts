// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import type { ApiName, ApiRequestType, ApiResponseType } from './ApiName';
import { validate } from './ApiValidator';

// Object containing the server endpoints for each of the known APIs. Missing entries will result in
// type validation errors, which may occur after updating the schema.
const kEndpoints: { [key in ApiName]: string } = {
    IApplication: '/api/application',
    IAuth: '/api/auth',
    IAvatar: '/api/avatar',
    IContent: '/api/content',
    IEnvironment: '/api/environment',
    IEvent: '/api/event',
    INotes: '/api/notes',
    IUser: '/api/user',
};

// Provides the ability to issue an API request, with known type information for both the request
// and response information. Validation will be done by this class prior to announcing success.
export class ApiRequest<K extends ApiName> {
    #api: K;
    #hash: number;

    constructor(api: K) {
        this.#api = api;
        this.#hash = 0;
    }

    // Returns the name of the API for which this ApiRequest instance exists.
    get api() { return this.#api; }

    // Returns the calculated hash from the latest response. Definitely a non-cryptographic value.
    get hash() { return this.#hash; }

    // Issues a request on the API. The |request| is conditionally required if the |T| defines the
    // required request parameters. When the request could be completed successfully, the promise
    // will be resolved with the validated response. Otherwise an exception will be thrown. When
    // passed, the |signal| can be used to abort the request when it's in progress.
    async issue(request: ApiRequestType<K>, signal?: AbortSignal): Promise<ApiResponseType<K>> {
        // If |request| is given, iterate over all key/value pairs. Values will be added to either
        // the |parameters| (when the key is defined to behave as such) or in the |body| in all
        // all cases, influencing how the data is communicated with the server.
        let parameters: URLSearchParams | undefined;
        let body: FormData | undefined;

        if (typeof request === 'object') {
            for (const [ key, value ] of Object.entries(request as { [k: string]: any })) {
                switch (key) {
                    case 'authToken':
                    case 'event':
                        parameters ??= new URLSearchParams();
                        parameters.set(key, value);
                        break;

                    default:
                        body ??= new FormData();
                        body.set(key, value);
                        break;
                }
            }
        }

        // Compose the qualified endpoint, which combines the endpoint with the |parameters|. The
        // hostname can be overridden by using the REACT_APP_API_HOST, for development purposes.
        const endpoint = (process.env.REACT_APP_API_HOST || '') + kEndpoints[this.#api];
        const qualifiedEndpoint = parameters ? endpoint + '?' + parameters.toString()
                                             : endpoint;

        // Issue the actual request. When there is content in |body|, the request method will be
        // updated to POST automatically. Otherwise GET will be used.
        const response = await fetch(qualifiedEndpoint, {
            cache: 'reload',
            method: body ? 'POST' : 'GET',
            body, signal,
        });

        if (!response.ok)
            throw new Error(`Unable to fetch data from the server (${response.status}).`);

        const responseClone = response.clone();
        const responseData = await response.json();

        if (!validate<ApiResponseType<K>>(responseData, `${this.#api}Response`))
            throw new Error('Unable to validate the fetched data from the server.');

        this.#hash = 0;

        // Given that the |responseData| was successfully validated, re-consume the body from the
        // |responseClone| and use that to calculate a hash of the returned content.
        const buffer = new Uint8Array(await responseClone.arrayBuffer());
        for (let i = 0; i < buffer.length; ++i)
            this.#hash = (((this.#hash << 5) - this.#hash) + buffer[i]) | 0;

        return responseData;
    }
}
