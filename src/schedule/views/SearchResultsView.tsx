// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { Fragment, h } from 'preact';

import { AppTitle } from '../../AppTitle';

export interface SearchResultsViewProps {
    query: string;
};

export function SearchResultsView(props: SearchResultsViewProps) {
    return (
        <Fragment>
            <AppTitle title="Search Results" />
            <p>
                SearchResultsView ({props.query})
            </p>
        </Fragment>
    );
}
