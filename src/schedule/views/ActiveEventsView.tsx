// Copyright 2022 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { Fragment, h } from 'preact';
import { useMemo, useState } from 'preact/hooks';

import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Card from '@mui/material/Card';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import MapsHomeWorkIcon from '@mui/icons-material/MapsHomeWork';
import Stack from '@mui/material/Stack';

import { AppTitle } from '../../AppTitle';
import { DateTime } from '../../base/DateTime';
import { Event, EventArea, EventSession } from '../../base/Event';
import { EventListItem } from '../components/EventListItem';
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
    const [ sortedAreas, activeSessionLength ] = useMemo(() => {
        const activeSessions = useMemo(() => event.findActiveSessions(dateTime), [ dateTime ]);
        const activeAreas = new Map<EventArea, EventSession[]>();

        // (1) Collate all the active sessions by the area they're being hosted in.
        for (const session of activeSessions) {
            if (!activeAreas.has(session.location.area))
                activeAreas.set(session.location.area, [ session ]);
            else
                activeAreas.get(session.location.area)?.push(session);
        }

        // (2) Sort the areas by their name, in ascending order. Areas without active sessions are
        // included in the output array, to enable a consistent output.
        const populatedAreas = [ ...event.areas() ].map(area => {
            return {
                area,
                sessions: activeAreas.get(area) || []
            };
        });

        // (3) Sort the list of sessions for each area. We sort them based on the event name on this
        // page, in ascending order, to allow the user to quickly seek through the list.
        for (let areaIndex = 0; areaIndex < populatedAreas.length; ++areaIndex) {
            populatedAreas[areaIndex].sessions.sort((lhs, rhs) => {
                return lhs.name.localeCompare(rhs.name);
            });
        }

        return [ populatedAreas, activeSessions.length ];

    }, [ dateTime ]);

    return (
        <Fragment>
            <AppTitle title="Active events" />
            { !activeSessionLength &&
                <Alert elevation={1} severity="warning" sx={{ mt: { xs: 0, lg: 2 } }}>
                    <AlertTitle>Nothing to see here…</AlertTitle>
                    None of the <strong>{event.name}</strong> events are currently in progress.
                </Alert> }

            <Stack spacing={2} mt={2}>
                { sortedAreas.map(({ area, sessions }) => {
                    const url = `/schedule/${event.identifier}/events/${area.identifier}/`;
                    return (
                        <Fragment>
                        <Card>
                            <LocationHeader icon={ <MapsHomeWorkIcon color="primary" /> }
                                            title={area.name}
                                            url={url} />
                            { sessions.length > 0 &&
                                <Fragment>
                                    <Divider />
                                    <List dense disablePadding>
                                        { sessions.map(session =>
                                            <EventListItem dateTime={dateTime}
                                                        event={event}
                                                        session={session}
                                                        timeDisplay="relative" /> )}
                                    </List>
                                </Fragment> }
                            </Card>
                        </Fragment>
                    );
                }) }
            </Stack>
        </Fragment>
    );
}
