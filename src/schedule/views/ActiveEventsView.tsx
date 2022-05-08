// Copyright 2022 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { Fragment, h } from 'preact';
import { useMemo, useState } from 'preact/hooks';

import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';

import { AppTitle } from '../../AppTitle';
import { DateTime } from '../../base/DateTime';
import { Event, EventArea, EventSession } from '../../base/Event';
import { LocationHeader } from '../components/LocationHeader';

// Properties passed to the <ActiveEventsViews> component.
interface ActiveEventsViewProps {
    /**
     * The event for which the active events should be listed.
     */
     event: Event;
}

// Lists the events that are currently active on the festival. A "card" will be displayed for each
// area, immediately followed by the events currently active in that area.
export function ActiveEventsView(props: ActiveEventsViewProps) {
    const { event } = props;

    const [ dateTime, setDateTime ] = useState(DateTime.local());
    // TODO: Subscribe to an effect for propagating event schedule updates.

    // Find all the active sessions. We work our way backwards to areas for this view as we're able
    // to use the interval tree here, which is not the case for the location-specific views.
    const sortedAreas = useMemo(() => {
        const activeSessions = useMemo(() => event.findActiveSessions(dateTime), [ dateTime ]);
        const activeAreas = new Map<EventArea, EventSession[]>();

        // (1) Collate all the active sessions by the area they're being hosted in.
        for (const session of activeSessions) {
            if (!activeAreas.has(session.location.area))
                activeAreas.set(session.location.area, [ session ]);
            else
                activeAreas.get(session.location.area)?.push(session);
        }

        // (2) Sort the areas by their name, in ascending order.
        const sortedAreas = [ ...activeAreas.values() ].sort((lhs, rhs) =>
            lhs[0].location.area.name.localeCompare(rhs[0].location.area.name));

        // (3) Sort the list of sessions for each area.
        for (let areaIndex = 0; areaIndex < sortedAreas.length; ++areaIndex) {
            sortedAreas[areaIndex].sort((lhs, rhs) => {
                // TODO: How to sort?
                return 0;
            });
        }

        return sortedAreas;

    }, [ dateTime ]);

    return (
        <Fragment>
            <AppTitle title="Active events" />
            { !sortedAreas.length &&
                <Fragment>
                    <Alert elevation={1} severity="warning" sx={{ mt: { xs: 0, lg: 2 } }}>
                        <AlertTitle>Nothing to see here…</AlertTitle>
                        None of the <strong>{event.name}</strong> events are currently in progress.
                        Has the festival started yet, or worse, has finished?
                    </Alert>
                    <Stack spacing={2} mt={2}>
                        { [ ...event.areas() ].map(area => {
                            const url = `/schedule/${event.identifier}/events/${area.identifier}/`;
                            return <Card>
                                       <LocationHeader title={area.name} url={url} />
                                   </Card>;
                        }) }
                    </Stack>
                </Fragment> }
        </Fragment>
    );
}
