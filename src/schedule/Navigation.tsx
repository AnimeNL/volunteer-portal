// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { h } from 'preact';

import AccessTimeIcon from '@mui/icons-material/AccessTime';
import Badge from '@mui/material/Badge';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import EventNoteIcon from '@mui/icons-material/EventNote';
import GroupIcon from '@mui/icons-material/Group';
import HomeIcon from '@mui/icons-material/Home';

// Properties that can be passed to the <Navigation> component. Values will be valid for both the
// mobile and desktop views of this component, even if their composition is entirely different.
export interface NavigationProps {
    // Which page of the navigation interface should be active?
    active: 'overview' | 'schedule' | 'events' | 'volunteers';

    // Badge to display for the number of active events, if any.
    badgeEvents?: number;

    // Badge to display when the user's schedule has an active entry.
    badgeSchedule?: boolean;

    // Badge to display for the number of active volunteers, if any.
    badgeVolunteers?: number;
};

// The <Navigation> component powers the main navigation capability of the volunteer portal. On
// mobile platforms, this displays a bottom-bar navigation in which the active item will be
// highlighted, while the other items will be in a slightly smaller state.
//
// https://mui.com/components/bottom-navigation/
//
// On desktop platforms, the <Navigation> component will instead produce a list that can be shown
// on the left- or right-hand side of the main content, to make better use of the available screen
// estate, without polluting it with a full side-drawer.
export function Navigation(props: NavigationProps) {
    const eventIcon =
        props.badgeEvents ? <Badge color="error" badgeContent={props.badgeEvents}><EventNoteIcon /></Badge>
                          : <EventNoteIcon />;

    const scheduleIcon =
        props.badgeSchedule ? <Badge color="error" variant="dot"><AccessTimeIcon /></Badge>
                            : <AccessTimeIcon />;

    const volunteersIcon =
        props.badgeVolunteers ? <Badge color="error" badgeContent={props.badgeVolunteers}><GroupIcon /></Badge>
                              : <GroupIcon />;

    return (
        <BottomNavigation value={props.active}>
            <BottomNavigationAction label="Overview"
                                    value="overview"
                                    icon={ <HomeIcon /> } />
            <BottomNavigationAction label="Schedule"
                                    value="schedule"
                                    icon={scheduleIcon} />
            <BottomNavigationAction label="Events"
                                    value="events"
                                    icon={eventIcon} />
            <BottomNavigationAction label="Volunteers"
                                    value="volunteers"
                                    icon={volunteersIcon} />
        </BottomNavigation>
    );
}
