// Copyright 2022 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { Fragment, h } from 'preact';
import { route } from 'preact-router';
import { useCallback } from 'preact/compat';

import sx from 'mui-sx';

import { default as ListItem, type ListItemProps } from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import { SxProps, Theme } from '@mui/system';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import VisibilityIcon from '@mui/icons-material/Visibility';
import grey from '@mui/material/colors/grey';
import { darken, lighten } from '@mui/material/styles';

import { DateTime } from '../../base/DateTime';
import { Event, EventSession } from '../../base/Event';

// Type indicating where in the lifecycle the event is at time of being rendered.
type EventLifecycleState = 'finished' | 'active' | 'default';

// CSS customizations applied to the <EventListItem> component.
const kStyles: { [key: string]: SxProps<Theme> } = {
    eventActive: {
        backgroundColor: theme => {
            return theme.palette.mode === 'dark' ? darken(/* green[900]= */ '#1B5E20', .1)
                                                 : lighten(theme.palette.success.light, .9);
        },
    },

    eventPast: {
        backgroundColor: theme => {
            return theme.palette.mode === 'dark' ? lighten(grey[900], .01)
                                                 : grey[300];
        },

        color: theme => {
            return theme.palette.mode === 'dark' ? grey[600]
                                                 : theme.palette.common.black;
        },
    },

    nameTypography: {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
};

// Properties available for the <EventListItemRoot> component. Extends the base <ListItem> props.
interface EventListItemRootProps extends ListItemProps {
    /**
     * The event for which the line item is being rendered, determines linkability.
     */
    event?: Event;

    /**
     * The specific session for which the line item is being rendered. This information is always
     * available to the <EventListItem> component, and is necessary for linkability.
     */
    session: EventSession;
}

// The root element for the <EventListItem> component, which enables the event ListItem to toggle
// linkability based on the availability of the necessary information.
function EventListItemRoot(props: EventListItemRootProps) {
    const { children, event, session, ...rest } = props;

    if (!event || !session)
        return <ListItem {...rest}>{children}</ListItem>;

    const navigationCallback = useCallback(() => {
        route(`/schedule/${event.identifier}/event/${session.event.identifier}/`);
    }, [ event, session ]);

    return (
        <ListItemButton onClick={navigationCallback}
                        {...rest as any}>
            {children}
        </ListItemButton>
    );
}

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
    event?: Event;

    /**
     * Whether to skip highlighting visibility of this event, in case other UI is used.
     */
    noVisibilityHighlight?: boolean;

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
//   dateTime               Enables customized rendering for events that happened in the past, are
//                          active, or are still pending. The first will be displayed in a smaller
//                          manner, whereas active events will be highlighted in green.
//
//   event                  Enables the user to click on this component to link through to the
//                          session's page. This is an awful manner to indicate linkability..
//
//   noVisibilityHighlight  Whether to skip highlighting reduced visibility of this event, to enable
//                          more targetted UI in another part of the interface.
//
//   timeDisplay            Controls display of the time on the right-hand side of the event's row.
//                          When included, it can either be shown as absolute times (i.e. duration)
//                          or relative to the |dateTime| passed to this component.
//
// TODO: Consider a nicer mechanism for routing rather than having to pass |event|.
// TODO: Colour usage in this component should be Dark Mode-aware.
export function EventListItem(props: EventListItemProps) {
    const { dateTime, event, session, timeDisplay } = props;

    // Whether to highlight that this is an event that's not visible to visitors. Volunteers need
    // additional information to do their job, such as when to participate in area build-ups.
    const highlightHiddenEvent = session.event.hidden && !props.noVisibilityHighlight;

    // Decide the lifetime of the |event| if |dateTime| has been given, otherwise fall back to the
    // default (also pending) state which is shown as a regular list item.
    const state: EventLifecycleState =
        dateTime ? (session.endTime.isBefore(dateTime)
                        ? 'finished'
                        : (session.startTime.isBefore(dateTime) ? 'active'
                                                                : 'default'))
                 : /* default status= */ 'default';

    return (
        <EventListItemRoot event={event} session={session}
                           sx={sx(
                                { condition: state === 'active', sx: kStyles.eventActive },
                                { condition: state === 'finished', sx: kStyles.eventPast }) }>

            { highlightHiddenEvent &&
                <ListItemText primaryTypographyProps={{ sx: kStyles.nameTypography }}
                              primary={
                    <Fragment>
                        <em>{session.name}</em>
                        <Tooltip title="Hidden from visitors">
                            <VisibilityIcon fontSize="inherit" color="info"
                                            sx={{ marginLeft: 1, verticalAlign: 'middle' }} />
                        </Tooltip>
                    </Fragment> } /> }

            { !highlightHiddenEvent && <ListItemText primaryTypographyProps={{ sx: kStyles.nameTypography }}
                                                     primary={session.name} /> }

            { timeDisplay === 'absolute' &&
                <Typography sx={{ flexShrink: 0, pl: 1 }} variant="body2">
                    { session.startTime.format('dayShort') }, { session.startTime.format('time') }–{ session.endTime.format('time') }
                </Typography> }

            { timeDisplay === 'relative' && !!dateTime && dateTime.isBefore(session.endTime) &&
                <Typography sx={{ flexShrink: 0, pl: 1 }} variant="body2">
                    { state === 'active' && dateTime.formatUntil(session.endTime) }
                    { state === 'default' && dateTime.formatUntil(session.startTime, /* prefix= */ '') }
                </Typography> }

        </EventListItemRoot>
    );
}
