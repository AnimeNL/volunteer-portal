// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import moment from 'moment-timezone';

import { Cache } from './Cache';
import { CachedLoader } from './CachedLoader';
import { Configuration } from './Configuration';
import { Content, ContentPage } from './Content';
import { IContentResponse, IContentResponsePage } from '../api/IContent';

import { validateArray, validateNumber, validateString } from './TypeValidators';

/**
 * Message to include with the exception thrown when data is being accessed before the content
 * has been initialized properly.
 */
const kExceptionMessage = 'The Content object has not been successfully initialized yet.';

/**
 * Implementation of the Content interface. Has the ability to actually fetch and validate content
 * from the server, and is able to store this for offline consumption as well.
 */
export class ContentImpl implements Content {
    public static kCacheKey: string = 'portal-content-v2';

    private configuration: Configuration;
    private loader: CachedLoader;

    private content?: Map<string, ContentPage>;

    constructor(cache: Cache, configuration: Configuration) {
        this.configuration = configuration;
        this.loader = new CachedLoader(cache);
    }

    /**
     * Actually fetches the content information from the server through the defined API. The network
     * request will race with a local cache request, which will be updated in-place once the new
     * content is available.
     */
    async initialize(): Promise<boolean> {
        const content = await this.loader.initialize({
            cacheKey: ContentImpl.kCacheKey,
            url: this.configuration.getContentEndpoint(),
            validationFn: ContentImpl.prototype.validateContentResponse.bind(this),
        });

        if (!content)
            return false;

        this.content = new Map();
        for (const page of content.pages) {
            this.content.set(page.pathname, {
                ...page,

                // Store the |modified| time as a Moment instance in UTC, valid for UNIX timestamps.
                modified: moment.utc(page.modified)
            });
        }

        return true;
    }

    /**
     * Validates the given |content| as data given in the IContentResponse response format. Error
     * messages will be sent to the console's error buffer if the data could not be verified.
     */
    validateContentResponse(content: any): content is IContentResponse {
        const kInterfaceName = 'IContentResponse';

        if (!validateArray(content, kInterfaceName, 'pages'))
            return false;

        for (const page of content.pages) {
            if (!this.validateContentResponsePage(page))
                return false;
        }

        return true;
    }

    /**
     * Validates whether the given |page| is a valid IContentResponsePage structure. This data will
     * generally have been sourced from untrusted input, i.e. the network.
     */
    validateContentResponsePage(page: any): page is IContentResponsePage {
        const kInterfaceName = 'IContentResponsePage';

        return validateString(page, kInterfaceName, 'pathname') &&
               validateString(page, kInterfaceName, 'content') &&
               validateNumber(page, kInterfaceName, 'modified');
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
