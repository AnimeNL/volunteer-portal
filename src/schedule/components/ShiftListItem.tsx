// Copyright 2022 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { h } from 'preact';
import { route } from 'preact-router';
import { useCallback } from 'preact/compat';

import sx from 'mui-sx';

import Avatar from '@mui/material/Avatar';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import { SxProps, Theme } from '@mui/system';
import { darken, lighten } from '@mui/material/styles';
import grey from '@mui/material/colors/grey';

import { DateTime } from '../../base/DateTime';
import { Event, EventShift } from '../../base/Event';
import { initials } from '../../base/NameUtilities';

// Type indicating where in the lifecycle the shift is at time of being rendered.
type ShiftLifecycleState = 'finished' | 'active' | 'default';

// CSS customizations applied to the <ShiftListItem> component.
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

// Properties available for the <ShiftListItem> component.
interface ShiftListItemProps {
    /**
     * DateTime at the instance that this list item is being rendered.
     */
    dateTime: DateTime;

    /**
     * Whether to display this shift as the event or as the volunteer.
     */
    display: 'event' | 'volunteer';

    /**
     * The event this shift is part of. Required for making the item linkable.
     */
    event: Event;

    /**
     * The shift for which the list item is being rendered.
     */
    shift: EventShift;
}

// Displays information about a particular shift in the form of a list item. Optimized for display
// on the volunteer overview page, and not particularly well generalized.
export function ShiftListItem(props: ShiftListItemProps) {
    const { dateTime, display, event, shift } = props;

    if (!shift.event)
        return <></>;

    // TODO: Display timing information for the shift in the list item.
    // TODO: Display which other volunteers will be helping out during that shift?

    // Decide the lifetime of the |shift| with the given |dateTime| has been given.
    const state: ShiftLifecycleState =
        dateTime ? (shift.endTime.isBefore(dateTime)
                        ? 'finished'
                        : (shift.startTime.isBefore(dateTime) ? 'active'
                                                              : 'default'))
                 : /* default status= */ 'default';

    // Navigates to either the event page (which is assumed to contain more information), or the
    // volunteer page, depending on the |display| that has been configured for this list item.
    const handleNavigation = useCallback(() => {
        if (display === 'event')
            route(`/schedule/${event.identifier}/event/${shift.event?.identifier}/`);
        else
            route(`/schedule/${event.identifier}/volunteers/${shift.volunteer.identifier}/`);

    }, [ display, event, shift ]);

    return (
        <ListItemButton onClick={handleNavigation}
                        sx={sx(
                                { condition: state === 'active', sx: kStyles.eventActive },
                                { condition: state === 'finished', sx: kStyles.eventPast }) }>

            { display === 'volunteer' &&
                <ListItemAvatar>
                    <Avatar alt={shift.volunteer.name}
                            src={shift.volunteer.avatar}>
                        {initials(shift.volunteer.name)}
                    </Avatar>

                </ListItemAvatar> }

            { display === 'event' &&
                <ListItemText primary={shift.event.sessions[0].name} /> }

            { display === 'volunteer' &&
                <ListItemText primary={shift.volunteer.name} /> }

        </ListItemButton>
    );
}
