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

    // Compile a list of sessions that take place in this |location|, grouped by day.
    const sessionDays: Record<string, EventSession[]> = {};

    for (const session of location.sessions) {
        const sessionDay = session.startTime.format('date');
        if (sessionDays.hasOwnProperty(sessionDay))
            sessionDays[sessionDay].push(session);
        else
            sessionDays[sessionDay] = [ session ];
    }

    // TODO: Move days in the past to the end of |sessionDays|.

    const [ dateTime, setDateTime ] = useState(DateTime.local());
    // TODO: Subscribe to an effect for propagating event schedule updates.

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
            { Object.entries(sessionDays).map(([ date, sessions ]) => {
                const header = sessions[0].startTime.format('day');

                return (
                    <Fragment>
                        <SubTitle>{header}</SubTitle>
                        <Paper>
                            <List disablePadding>
                                { sessions.map(session =>
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
