// Copyright 2022 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { Fragment, h } from 'preact';
import { useMemo, useState } from 'preact/hooks';

import AlertTitle from '@mui/material/AlertTitle';
import Card from '@mui/material/Card';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import MapsHomeWorkIcon from '@mui/icons-material/MapsHomeWork';
import PauseCircleOutlineIcon from '@mui/icons-material/PauseCircleOutline';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';

import { AppTitle } from '../../AppTitle';
import { DarkModeCapableAlert } from '../components/DarkModeCapableAlert';
import { DateTime } from '../../base/DateTime';
import { Event, EventArea, EventSession } from '../../base/Event';
import { EventListItem } from '../components/EventListItem';
import { EventTracker } from '../../base/EventTracker';
import { LocationHeader } from '../components/LocationHeader';
import { TimeTicker } from '../components/TimeTicker';

// Properties passed to the <ActiveEventsViews> component.
interface ActiveEventsViewProps {
    /**
     * DateTime for which the <ActiveEventsView> has been rendered.
     */
    dateTime: DateTime;

    /**
     * EventTracker instance for the scheduling app.
     */
    eventTracker: EventTracker;

    /**
     * The event for which the active events should be listed.
     */
    event: Event;
}

// Lists the events that are currently active on the festival. A "card" will be displayed for each
// area, immediately followed by the events currently active in that area.
export function ActiveEventsView(props: ActiveEventsViewProps) {
    const { dateTime, eventTracker, event } = props;

    // Find all the active sessions. We work our way backwards to areas for this view as we're able
    // to use the interval tree here, which is not the case for the location-specific views.
    const [ sortedAreas, activeSessionLength, upcomingSession ] = useMemo(() => {
        const activeSessions = eventTracker.getActiveSessions();
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

        return [ populatedAreas, activeSessions.length, eventTracker.getUpcomingSession() ];

    }, [ dateTime ]);

    return (
        <Fragment>
            <AppTitle title="Active events" />
            { !activeSessionLength &&
                <DarkModeCapableAlert elevation={1} severity="warning" sx={{ mt: { xs: 0, md: 2 } }}>
                    { upcomingSession &&
                        <Fragment>
                            <AlertTitle>There are no active events</AlertTitle>
                            The next {event.name} event is scheduled to
                            start <TimeTicker dateTime={dateTime} target={upcomingSession.startTime} />.
                        </Fragment> }
                    { !upcomingSession &&
                        <Fragment>
                            <AlertTitle>{event.name} has finished</AlertTitle>
                            There won't be any further events as the festival has finished.
                        </Fragment> }
                </DarkModeCapableAlert> }

            <Stack spacing={2} mt={2}>
                { sortedAreas.map(({ area, sessions }) => {
                    const url = `/schedule/${event.identifier}/events/${area.identifier}/`;
                    const action =
                        sessions.length ? undefined
                                        : <Tooltip title="No active events">
                                              <PauseCircleOutlineIcon color="primary" />
                                          </Tooltip>

                    return (
                        <Fragment>
                        <Card>
                            <LocationHeader action={action}
                                            icon={ <MapsHomeWorkIcon color="primary" /> }
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
