// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { h, Fragment } from 'preact';
import { useContext } from 'preact/hooks';

import { AppContext } from '../AppContext';
import { ApplicationBar } from './ApplicationBar';
import { Navigation } from './Navigation';

// Properties accepted by the <ScheduleApp> component.
export interface ScheduleAppProps {
    // Identifier of the event to load.
    event: string;

    // Remainder of the request path, i.e. the portion that follows after the event identifier.
    request?: string;
}

export function ScheduleApp(props: ScheduleAppProps) {
    const { event } = useContext(AppContext);
    if (!event)
        return <></>;

    return (
        <Fragment>
            <ApplicationBar title={event.identifier}/>
            <p>
                Hello, world!
            </p>
            <Navigation active="events"
                        badgeEvents={12}
                        badgeSchedule={true}
                        badgeVolunteers={7} />
        </Fragment>
    );
}
