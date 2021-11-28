// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import type { DateTime } from './DateTime';
import type { IContentResponsePage } from '../api/IContent';

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

export type ContentPage = Omit<Readonly<IContentResponsePage>, 'modified'> & {
    /**
     * Last modification time of content on the page, as a DateTime instance. The time has not
     * been adjusted to any particular timezone.
     */
    modified: Readonly<DateTime>;
}
