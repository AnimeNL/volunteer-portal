// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { Fragment, h } from 'preact';

import { AppTitle } from '../../AppTitle';

export interface LocationListViewProps {
    area: string;
};

export function LocationListView(props: LocationListViewProps) {
    return (
        <Fragment>
            <AppTitle title="Area" />
            <p>
                LocationListView ({props.area})
            </p>
        </Fragment>
    );
}
