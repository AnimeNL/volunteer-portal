// Copyright 2022 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { h } from 'preact';
import { route } from 'preact-router';

import sx from 'mui-sx';

import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import ListItemText from '@mui/material/ListItemText';
import { SxProps, Theme } from '@mui/system';
import Typography from '@mui/material/Typography';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import grey from '@mui/material/colors/grey';
import { lighten } from '@mui/material/styles';

import { DateTime } from '../../base/DateTime';
import { Event, EventSession } from '../../base/Event';

// Type indicating where in the lifecycle the event is at time of being rendered.
type EventLifecycleState = 'finished' | 'active' | 'default';

// CSS customizations applied to the <EventListItem> component.
const kStyles: { [key: string]: SxProps<Theme> } = {
    eventActive: {
        backgroundColor: theme => lighten(theme.palette.success.light, .9),
    },

    eventPast: {
        backgroundColor: grey[300],
    },
};

// Properties available for the <EventListItem> component.
interface EventListItemProps {
    /**
     * The date & time at the time that the entry is being displayed. Enables calculations for
     * displaying whether the event happened in the past, is active, or is still pending.
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

    /**
     * Manner in which the event's time should be displayed on the component. There are three main
     * display methods available:
     *
     *   none       Does not display the event's times on the row at all. (Default.)
     *   absolute   Displays the event's start and end times on the row's right-hand side.
     *   relative   Displays the event's start or end time relative to |dateTime|.
     *
     * When relative time display is used and |dateTime| has not been passed as a prop to this
     * component, the time will not be displayed at all.
     */
    timeDisplay?: 'none' | 'absolute' | 'relative';
}

// The <EventListItem> component displays a list item for a particular event session.
//
// This is one of the more complex components in our application, as events can be referred to in a
// variety of ways. The props accepted by this component attept to cater for each of those ways in
// a sensible manner, allowing it to be used in each of those cases.
//
// By default, a <EventListItem> is a regular <ListItem> that displays the event's name. This can
// then be iterated on by passing one or multiple additional props:
//
//   dateTime       Enables customized rendering for events that happened in the past, are currently
//                  active, or are still pending. The first will be displayed in a smaller, grey
//                  manner, whereas active events will be highlighted in green.
//
//   event          Enables the user to click on this component to link through to the session's
//                  information page. This is an awful manner to indicate linkability, but hey ho.
//
//   timeDisplay    Controls display of the time on the right-hand side of the event's row. When
//                  included, it can either be shown as absolute times (i.e. duration) or relative
//                  to the |dateTime| passed to this component.
//
// TODO: Use <ListItem> rather than <ListItemButton> when |event| is not set.
// TODO: Consider a nicer mechanism for routing rather than having to pass |event|.
// TODO: Colour usage in this component should be Dark Mode-aware.
// TODO: The "hidden" icon looks appaling, make it look a little bit nicer.
export function EventListItem(props: EventListItemProps) {
    const { dateTime, event, session, timeDisplay } = props;

    function navigateToEvent() {
        route(`/schedule/${event.identifier}/event/${session.event.identifier}/`);
    }

    // Decide the lifetime of the |event| if |dateTime| has been given, otherwise fall back to the
    // default (also pending) state which is shown as a regular list item.
    const state: EventLifecycleState =
        dateTime ? (session.endTime.isBefore(dateTime)
                        ? 'finished'
                        : (session.startTime.isBefore(dateTime) ? 'active'
                                                                : 'default'))
                 : /* default status= */ 'default';

    return (
        <ListItemButton dense={state === 'finished'}
                        onClick={navigateToEvent}
                        sx={sx(
                                { condition: state === 'active', sx: kStyles.eventActive },
                                { condition: state === 'finished', sx: kStyles.eventPast }) }>

            { session.event.hidden &&
                <ListItemAvatar>
                    <VisibilityOffIcon />
                </ListItemAvatar> }

            <ListItemText primary={session.name} />

            <ListItemSecondaryAction>
                { timeDisplay === 'absolute' &&
                    <Typography variant="body2">
                        { session.startTime.format('time') } – { session.endTime.format('time') }
                    </Typography> }

                { timeDisplay === 'relative' && !!dateTime && dateTime.isBefore(session.endTime) &&
                    <Typography variant="body2">
                        { state === 'active' && dateTime.formatUntil(session.endTime) }
                        { state === 'default' && dateTime.formatUntil(session.startTime, /* prefix= */ '') }
                    </Typography> }

            </ListItemSecondaryAction>

        </ListItemButton>
    );
}
