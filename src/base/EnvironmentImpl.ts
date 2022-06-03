// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { ApiRequestManager, ApiRequestObserver } from './ApiRequestManager';

import type { Environment, EnvironmentEvent } from './Environment';
import type { IEnvironmentResponse } from '../api/IEnvironment';
import type { Invalidatable } from './Invalidatable';

/**
 * Message to include with the exception thrown when data is being accessed before the Environment
 * has been initialized properly.
 */
const kExceptionMessage = 'The Environment object has not been successfully initialized yet.';

/**
 * Implementation of the Environment interface, shared across the entire Volunteer Portal.
 */
export class EnvironmentImpl implements ApiRequestObserver<'IEnvironment'>, Environment {
    private requestManager: ApiRequestManager<'IEnvironment'>;
    private responseData?: IEnvironmentResponse;

    private observer?: Invalidatable;

    constructor(observer?: Invalidatable) {
        this.requestManager = new ApiRequestManager('IEnvironment', this);
        this.observer = observer;
    }

    /**
     * Initializes the content by issuing an API call request, and returns when that request has
     * been completed successfully. The initial content may be sourced from the local cache.
     */
    async initialize(): Promise<boolean> {
        return this.requestManager.issue();
    }

    // ---------------------------------------------------------------------------------------------
    // ApiRequestObserver interface implementation
    // ---------------------------------------------------------------------------------------------

    onFailedResponse(error: Error) { /* handled in the App */ }
    onSuccessResponse(response: IEnvironmentResponse) {
        this.responseData = response;

        if (this.observer)
            this.observer.invalidate();
    }

    // ---------------------------------------------------------------------------------------------
    // Environment interface implementation
    // ---------------------------------------------------------------------------------------------

    get title(): Readonly<string> {
        if (!this.responseData)
            throw new Error(kExceptionMessage);

        return this.responseData.title;
    }

    get themeColor(): Readonly<string> {
        if (!this.responseData)
            throw new Error(kExceptionMessage);

        return this.responseData.themeColor;
    }

    get themeColorDarkMode(): Readonly<string | undefined> {
        if (!this.responseData)
            throw new Error(kExceptionMessage);

        return this.responseData.themeColorDarkMode
    }

    get themeTitle(): Readonly<string> {
        if (!this.responseData)
            throw new Error(kExceptionMessage);

        return this.responseData.themeTitle;
    }

    get events(): Readonly<EnvironmentEvent>[] {
        if (!this.responseData)
            throw new Error(kExceptionMessage);

        return this.responseData.events;
    }

    get contactName(): Readonly<string> {
        if (!this.responseData)
            throw new Error(kExceptionMessage);

        return this.responseData.contactName;
    }

    get contactTarget(): undefined | Readonly<string> {
        if (!this.responseData)
            throw new Error(kExceptionMessage);

        return this.responseData.contactTarget;
    }
}
