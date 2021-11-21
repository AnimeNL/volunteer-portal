// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

/**
 * The /api/content call makes available textual information that should be displayed on the page.
 * Such content can be specialized based on the environment, useful when different volunteering
 * teams are subject to different expectations.
 */
export interface IContent {
    response: IContentResponse;
}

/**
 * Response shared by the server following an /api/content call. Contains zero or more pages of
 * content that can be displayed on the site itself.
 */
export interface IContentResponse {
    pages: IContentResponsePage[];
}

/**
 * Information regarding an individual page contained in the /api/content call. The `pathname` is
 * expected to be unique across all of the returned pages.
 */
export interface IContentResponsePage {
    /**
     * Path, relative to the base of the volunteer portal, where this content can be found.
     *
     * @pattern ^/
     */
    pathname: string;

    /**
     * Content of the page. Can contain Markdown content, which will be translated to HTML before
     * being displayed to the visitor. HTML included in the content will be ignored.
     *
     * @see https://www.markdownguide.org/basic-syntax/
     */
    content: string;

    /**
     * Title of the page, as should be displayed in the user interface. The environment's title will
     * be used in lieu of this property.
     */
    title?: string;

    /**
     * Last modification time of content on the page, as a UNIX timestamp in seconds. Modification
     * times between January 1st, 2010 and January 1st, 2030 (GMT+0000) will be considered valid.
     *
     * @minimum 1262304000
     * @maximum 1893456000
     */
    modified: number;
}
