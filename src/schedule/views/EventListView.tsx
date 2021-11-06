// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { Fragment, h } from 'preact';

import { AppTitle } from '../../AppTitle';

export interface EventListViewProps {
    area: string;
    location: string;
};

export function EventListView(props: EventListViewProps) {
    return (
        <Fragment>
            <AppTitle title="Location" />
            <p>
                EventListView ({props.area}, {props.location})
            </p>
        </Fragment>
    );
}
