// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

/**
 * @see https://github.com/AnimeNL/volunteer-portal/blob/main/API.md#response-icontentresponse
 */
export interface IContentResponse {
    pages: IContentResponsePage[];
}

/**
 * @see https://github.com/AnimeNL/volunteer-portal/blob/main/API.md#response-icontentresponsepage
 */
export interface IContentResponsePage {
    pathname: string;
    content: string;
    modified: number;
}
