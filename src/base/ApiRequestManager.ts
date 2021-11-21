// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import type { ApiName, ApiRequestType, ApiResponseType } from './ApiName';
import { ApiRequest } from './ApiRequest';

// Observer interface that users of the ApiRequestManager have to implement, which is used to inform
// the user about successful or failed requests issued to the API. Return values have been removed
// from the asynchronous methods to prevent misuse.
export interface ApiRequestObserver<T> {
    // Called when an issued request has failed, and could not be completed. When available, the
    // |error| will be included with more information. Diagnostics will be shared to the console.
    onFailedResponse: (error: Error) => Promise<void> | void;

    // Called when an issued request has succeeded. The |response| is the full, validated response
    // in accordance with the response type defined by the API. May be called multiple times during
    // the application's lifetime, in case multiple responses are being issued.
    onSuccessResponse: (response: ApiResponseType<T>) => Promise<void> | void;
}

// The ApiRequestManager abstracts over the ApiRequest by enabling direct access, as well as cached
// access (offline enabled) and timed updates in case the application is long living without reload.
export class ApiRequestManager<T> {
    private request: ApiRequest<T>;
    private observer: ApiRequestObserver<T>;

    constructor(api: ApiName, observer: ApiRequestObserver<T>) {
        this.request = new ApiRequest<T>(api);
        this.observer = observer;
    }

    // Issues a request on the API. The |request| is conditionally required if the |T| defines the
    // required request parameters. This method will resolve with a boolean indicating success,
    // which will happen *after* any attached ApiRequestObserver(s) will have been informed.
    async issue(request: ApiRequestType<T>): Promise<boolean> {
        // TODO: Only allow a single request to be in flight at once.
        // TODO: Enable caching of responses, but ignore for later requests.
        // TODO: Enable responses to be automatically re-issued after a predefined period of time?

        let response: ApiResponseType<T> | undefined;

        try {
            response = await this.request.issue(request);
        } catch (error) {
            await this.observer.onFailedResponse(error as Error);
            return false;
        }

        await this.observer.onSuccessResponse(response);
        return true;
    }
}
