// Copyright 2022 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { Fragment, h } from 'preact';

import { AppTitle } from '../../AppTitle';
import { Event } from '../../base/Event';

export interface EventViewProps {
    event: Event;
    eventIdentifier: string;
};

export function EventView(props: EventViewProps) {
    const { event, eventIdentifier } = props;

    return (
        <Fragment>
            <AppTitle title="Event" />
            <p>
                EventView ({eventIdentifier})
            </p>
        </Fragment>
    );
}
