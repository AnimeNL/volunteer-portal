// Copyright 2022 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { Fragment, h } from 'preact';
import { route } from 'preact-router';
import { useState } from 'preact/hooks';

import Avatar from '@mui/material/Avatar';
import List from '@mui/material/List';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import ListItem from '@mui/material/ListItem';
import Paper from '@mui/material/Paper';
import ReadMoreIcon from '@mui/icons-material/ReadMore';
import { SxProps, Theme } from '@mui/system';

import { AppTitle } from '../../AppTitle';
import { DateTime } from '../../base/DateTime';
import { Event, EventSession } from '../../base/Event';
import { EventListItem } from '../components/EventListItem';
import { SubTitle } from '../components/SubTitle';

// CSS customizations applied to the <EventListView>.
const kStyles: { [key: string]: SxProps<Theme> } = {
    nameTypography: {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
};

// Properties that can be passed to the <EventListView> component.
export interface EventListViewProps {
    /**
     * The event for which the locations are being listed.
     */
    event: Event;

    /**
     * Unique identifier indicating the area for which we want to see locations. This could be a
     * floor, an area within (or near) the event venue, or any other grouping.
     */
    area: string;

    /**
     * Unique identifier indicating the location within the area for which events have to be shown.
     */
    location: string;
};

// The <EventListView> component allows a user to see a list of events taking place in a particular
// location, indicated through props passed to this view. The layout mimics the event and volunteer
// detail pages, thus with a header followed by a list of sessions and volunteers.
export function EventListView(props: EventListViewProps) {
    const { event } = props;

    const area = event.area(props.area);
    const location = event.location(props.location);

    // Validate that the props are correct, and that the location in fact is part of the area that
    // has been requested, to avoid exposing identical content on multiple resource URLs.
    if (!area || !location || location.area !== area) {
        route(`/schedule/${event.identifier}/events/`);
        return <></>;
    }

    const [ dateTime, setDateTime ] = useState(DateTime.local());
    // TODO: Subscribe to an effect for propagating event schedule updates.

    type SessionInfo = { endPast: boolean; startPast: boolean; session: EventSession };
    type DailySessionInfo = { remainingEvents: boolean; sessions: SessionInfo[] };

    // Compile a list of the sessions that take place in this |location|. This is done in several
    // steps, to create a display order most useful for those looking at it during the convention.
    //
    // First, we group all the location.|session|s based on the day that they take place. Record
    // whether this day in its entirety happened in the past.
    //
    // Then, as a second step, we iterate through all the days and sort the sessions within them.
    // Active sessions are listed first, then pending sessions, then past sessions. Active sessions
    // then are sorted by name, for quick look-up, particularly useful for the event rooms.
    //
    // Finally, we move days for which all events have finished to the bottom of the overview. While
    // they're useful for historical context, they're likely not what the user is looking for.
    const sessionsByDay: Record<string, DailySessionInfo> = {};
    const eventSet = new Set();

    for (const session of location.sessions) {
        const sessionDay = session.startTime.format('date');

        if (!sessionsByDay.hasOwnProperty(sessionDay)) {
            sessionsByDay[sessionDay] = {
                remainingEvents: false,
                sessions: [],
            };
        }

        eventSet.add(session.event.identifier);

        sessionsByDay[sessionDay].remainingEvents ||= dateTime.isBefore(session.endTime);
        sessionsByDay[sessionDay].sessions.push({
            endPast: session.endTime.isBefore(dateTime),
            startPast: session.startTime.isBefore(dateTime),

            session,
        });
    }

    // There is an optimization we support here: if this location is only used for a single event
    // (with any number of sessions), we forward the user to the event page instead. This removes a
    // bit of redundancy for locations such as changing rooms, which are rather stationary as is.
    if (eventSet.size === 1) {
        route(`/schedule/${event.identifier}/event/${location.sessions[0].event.identifier}/`, true);
        return <></>;
    }

    for (const sessionDay in sessionsByDay) {
        sessionsByDay[sessionDay].sessions.sort((lhs, rhs) => {
            // (1) Move past events to the bottom of the list.
            if (lhs.endPast && !rhs.endPast)
                return 1;
            if (!lhs.endPast && rhs.endPast)
                return -1;

            // (2) Move (or keep) active events to the top of the list.
            if (lhs.startPast && !rhs.startPast)
                return -1;
            if (!lhs.startPast && rhs.startPast)
                return 1;

            // (3) Sort the active events based on the time at which they started.
            if (lhs.session.startTime.isBefore(rhs.session.startTime))
                return -1;
            if (rhs.session.startTime.isBefore(lhs.session.startTime))
                return 1;

            // (4) Sort events sharing a timeslot alphabetically.
            return lhs.session.name.localeCompare(rhs.session.name);
        });
    }

    const dayOrder = Object.keys(sessionsByDay).sort((lhs, rhs) => {
        if (sessionsByDay[lhs].remainingEvents && !sessionsByDay[rhs].remainingEvents)
            return -1;
        if (!sessionsByDay[lhs].remainingEvents && sessionsByDay[rhs].remainingEvents)
            return 1;

        return lhs.localeCompare(rhs);
    });

    return (
        <Fragment>
            <AppTitle title="Location" />
            <Paper elevation={2} sx={{ maxWidth: '100vw', marginTop: { lg: 2 } }}>
                <List>
                    <ListItem>
                        <ListItemAvatar>
                            <Avatar alt={location.name}>
                                <ReadMoreIcon />
                            </Avatar>
                        </ListItemAvatar>
                        <ListItemText primaryTypographyProps={{ sx: kStyles.nameTypography }}
                                      primary={location.name}
                                      secondary={area.name} />
                    </ListItem>
                </List>
            </Paper>
            { dayOrder.map(dayLabel => {
                const { remainingEvents, sessions } = sessionsByDay[dayLabel];
                const header = sessions[0].session.startTime.format('day');

                return (
                    <Fragment>
                        <SubTitle>{header} { !remainingEvents && '✔' }</SubTitle>
                        <Paper>
                            <List disablePadding>
                                { sessions.map(({ session }) =>
                                    <EventListItem dateTime={dateTime}
                                                   event={event}
                                                   session={session}
                                                   timeDisplay="absolute" /> )}
                            </List>
                        </Paper>
                    </Fragment>
                );
            })}
        </Fragment>
    );
}
