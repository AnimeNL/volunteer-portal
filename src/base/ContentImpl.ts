// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { ApiRequestManager, ApiRequestObserver } from './ApiRequestManager';
import { DateTime } from './DateTime';

import type { Content, ContentPage } from './Content';
import type { IContentResponse } from '../api/IContent';
import type { Invalidatable } from './Invalidatable';

/**
 * Message to include with the exception thrown when data is being accessed before the content
 * has been initialized properly.
 */
const kExceptionMessage = 'The Content object has not been successfully initialized yet.';

/**
 * Implementation of the Content interface, which provides the portal access to content pages that
 * should be exposed to our visitors.
 */
export class ContentImpl implements ApiRequestObserver<'IContent'>, Content {
    private requestManager: ApiRequestManager<'IContent'>;

    private content?: Map<string, ContentPage>;
    private observer?: Invalidatable;

    constructor(observer?: Invalidatable) {
        this.requestManager = new ApiRequestManager('IContent', this);
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
    onSuccessResponse(response: IContentResponse) {
        this.content = new Map();

        for (const page of response.pages) {
            this.content.set(page.pathname, {
                ...page,

                // Store the |modified| time as a DateTime instance, valid for UNIX timestamps.
                modified: DateTime.fromUnix(page.modified)
            });
        }

        if (this.observer)
            this.observer.invalidate();
    }

    // ---------------------------------------------------------------------------------------------
    // Content implementation:
    // ---------------------------------------------------------------------------------------------

    has(pathname: string): boolean {
        if (!this.content)
            throw new Error(kExceptionMessage);

        return this.content.has(pathname);
    }

    get(pathname: string): ContentPage | undefined {
        if (!this.content)
            throw new Error(kExceptionMessage);

        return this.content.get(pathname);
    }

    getPrefixed(prefix: string): ContentPage[] {
        if (!this.content)
            throw new Error(kExceptionMessage);

        const pages: ContentPage[] = [];
        for (const [ pathname, page ] of this.content.entries()) {
            if (pathname.startsWith(prefix))
                pages.push(page);
        }

        return pages.sort((lhs, rhs) => {
            if (lhs.pathname.length === rhs.pathname.length)
                return 0;

            return lhs.pathname.length > rhs.pathname.length ? -1 : 1;
        });
    }
}
