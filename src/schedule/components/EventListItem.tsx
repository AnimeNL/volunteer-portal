// Copyright 2022 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { h } from 'preact';
import { route } from 'preact-router';

import sx from 'mui-sx';

import ListItemButton from '@mui/material/ListItemButton';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import { SxProps, Theme } from '@mui/system';
import { lighten } from '@mui/material/styles';

import { DateTime } from '../../base/DateTime';
import { Event, EventSession } from '../../base/Event';


// CSS customizations applied to the <EventListItem> component.
const kStyles: { [key: string]: SxProps<Theme> } = {
    eventActive: {
        backgroundColor: theme => lighten(theme.palette.success.light, .9),
    },

    eventHidden: {
        color: 'gray',
    },

    eventPast: {
        backgroundColor: ''
    },
};

// Properties available for the <EventListItem> component.
interface EventListItemProps {
    /**
     * The date & time for which the entry is being displayed.
     */
    dateTime: DateTime;

    /**
     * The event for which the line item is being rendered. Needed to make it linkable.
     */
    event: Event;

    /**
     * The session for which the event list entry is being drawn.
     */
    session: EventSession;
}

// The <EventListItem> component displays a list item for a particular event session, given in the
// |props|. The session can have a lifetime state (active, in the past), and it will be considered
// whether the event is hidden, thus not visible to regular visitors.
export function EventListItem(props: EventListItemProps) {
    const { dateTime, event, session } = props;

    const past = session.endTime.isBefore(dateTime);
    const active = !past && session.startTime.isBefore(dateTime);

    const { hidden } = session.event;

    function navigateToEvent() {
        route(`/schedule/${event.identifier}/event/${session.event.identifier}/`);
    }

    return (
        <ListItemButton onClick={navigateToEvent} sx={sx(
            { condition: !!active, sx: kStyles.eventActive },
            { condition: !!past, sx: kStyles.eventPast })}>

            <ListItemText primary={session.name} />

            <ListItemSecondaryAction>
                <Typography variant="body2">
                    { active && dateTime.formatUntil(session.endTime) }
                    { !active && !past && dateTime.formatUntil(session.startTime, /* prefix= */ '') }
                </Typography>
            </ListItemSecondaryAction>

        </ListItemButton>
    );
}
