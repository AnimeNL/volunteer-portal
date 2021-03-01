// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

/**
 * Defines the interface through which application content can be accessed. Such content is keyed
 * by its pathname and can be specific to the environment.
 */
export interface Content {
    /**
     * Returns whether there is any known content for the given |pathname|.
     */
    has(pathname: string): boolean;

    /**
     * Returns the content associated with the given |pathname| when it can be found, or undefined
     * otherwise. All of the page's metadata will be included as well.
     */
    get(pathname: string): ContentPage | undefined;

    /**
     * Returns an array with all ContentPage entries whose pathname starts with |prefix|. Entries
     * will be sorted by length in descending order, to ensure more specific pages go first.
     */
    getPrefixed(prefix: string): ContentPage[];
}

/**
 * Details the information that will be made available for a particular piece of content. All data
 * contained within such objects should be considered immutable.
 */
export interface ContentPage {
    // Full pathname through which this content can be identified.
    pathname: Readonly<string>;

    // Contents of the page. May contain Markdown syntax.
    content: Readonly<string>;

    // Last modification time of the page. Indicated as a UNIX timestamp.
    // TODO: Change this to be a Moment instance once we include that library.
    modified: Readonly<number>;
}
