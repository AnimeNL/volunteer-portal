// Copyright 2022 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { h } from 'preact';

import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';

import { DateTime } from '../../base/DateTime';
import { EventShift } from '../../base/Event';

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
     * The shift for which the list item is being rendered.
     */
    shift: EventShift;
}

// Displays information about a particular shift in the form of a list item. Optimized for display
// on the volunteer overview page, and not particularly well generalized.
export function ShiftListItem(props: ShiftListItemProps) {
    const { dateTime, display, shift } = props;

    if (!shift.event)
        return <></>;

    // TODO: Display timing information for the shift in the list item.
    // TODO: Change the colour of the list item based on activity state.
    // TODO: Make the list item clickable, routing the user to the relevant event.
    // TODO: Display which other volunteers will be helping out during that shift?
    // TODO: Display avatars for the volunteers who will participate.

    return (
        <ListItemButton>
            { display === 'event' &&
                <ListItemText primary={shift.event.sessions[0].name} /> }

            { display === 'volunteer' &&
                <ListItemText primary={shift.volunteer.name} /> }

        </ListItemButton>
    );
}
