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
import { Event } from '../../base/Event';
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

// Props made available to the <EventView> component.
export interface EventViewProps {
    /**
     * The event for which this page is being shown.
     */
    event: Event;

    /**
     * Identifier for the "inner" event for which this page will be shown. This generally is a
     * string referring to some identifier given to us by the server.
     */
    eventIdentifier: string;
};

// The <EventView> component allows display of an individual event that happens during the festival.
// Each event can have a description, one or more sessions, and be associated with the shifts of any
// number of volunteers helping out with the festival.
//
// The layout of this view is based on the shift overview page, and users are expected to navigate
// between those frequently. The event's location is one of the most important pieces of information
// to surface on this page.
export function EventView(props: EventViewProps) {
    const { event, eventIdentifier } = props;

    // Validate that the |eventIdentifier| is valid on the passed Event so that we can find the
    // appropriate information. If not, route the user back to the overview page.
    const info = event.event(eventIdentifier);
    if (!info) {
        route(`/schedule/${event.identifier}/`);
        return <></>;
    }

    const [ dateTime, setDateTime ] = useState(DateTime.local());
    // TODO: Subscribe to an effect for propagating event schedule updates.

    // TODO: Chronologically sort the event's sessions?
    // TODO: Allow events to be favourited for display on the overview page.
    // TODO: Allow events to come with notes and instructions for volunteers.
    // TODO: Display volunteering shifts associated with this event.
    // TODO: Should we enable linking to a map with the location information?

    return (
        <Fragment>
            <AppTitle title={info.sessions[0].name} />
            <Paper elevation={2} sx={{ maxWidth: '100vw', marginTop: { lg: 2 } }}>
                <List>
                    <ListItem>
                        <ListItemAvatar>
                            <Avatar alt={info.sessions[0].name}>
                                <ReadMoreIcon />
                            </Avatar>
                        </ListItemAvatar>
                        <ListItemText primaryTypographyProps={{ sx: kStyles.nameTypography }}
                                      primary={info.sessions[0].name}
                                      secondary={info.sessions[0].location.name} />
                    </ListItem>
                </List>
            </Paper>
            <SubTitle>Sessions</SubTitle>
            <Paper>
                <List disablePadding>
                    { info.sessions.map(session =>
                        <EventListItem dateTime={dateTime}
                                       event={event}
                                       session={session}
                                       timeDisplay="absolute" /> )}
                </List>
            </Paper>
        </Fragment>
    );
}
