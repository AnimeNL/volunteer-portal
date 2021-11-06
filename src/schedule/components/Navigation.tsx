// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { h } from 'preact';
import { route } from 'preact-router';

import AccessTimeIcon from '@mui/icons-material/AccessTime';
import Badge from '@mui/material/Badge';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import EventNoteIcon from '@mui/icons-material/EventNote';
import GroupIcon from '@mui/icons-material/Group';
import HomeIcon from '@mui/icons-material/Home';
import Paper from '@mui/material/Paper';
import SettingsIcon from '@mui/icons-material/Settings';

// Active navigation that the user is on, as should be highlighted in the user interface.
export type NavigationActiveOptions = 'overview' | 'shifts' | 'areas' | 'volunteers' | 'admin';

// Properties that can be passed to the <Navigation> component. Values will be valid for both the
// mobile and desktop views of this component, even if their composition is entirely different.
export interface NavigationProps {
    // Which page of the navigation interface should be active?
    active: NavigationActiveOptions;

    // Badge to display for the number of active events, if any.
    badgeActiveEvents?: number;

    // Badge to display when the user's schedule has an active entry.
    badgeActiveShifts?: boolean;

    // Badge to display for the number of active volunteers, if any.
    badgeActiveVolunteers?: number;

    // Identifier of the event for which navigation is being provided.
    event: string;

    // Whether the navigation option to the administration screen should be displayed.
    showAdministration?: boolean;
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
    const eventsIcon =
        props.badgeActiveEvents ? <Badge color="error" badgeContent={props.badgeActiveEvents}>
                                      <EventNoteIcon />
                                  </Badge>
                                : <EventNoteIcon />;

    const shiftsIcon =
        props.badgeActiveShifts ? <Badge color="error" variant="dot">
                                      <AccessTimeIcon />
                                  </Badge>
                                : <AccessTimeIcon />;

    const volunteersIcon =
        props.badgeActiveVolunteers ? <Badge color="error" badgeContent={props.badgeActiveVolunteers}>
                                          <GroupIcon />
                                      </Badge>
                                    : <GroupIcon />;

    function activateItem(event: React.SyntheticEvent<Element, Event>, newValue: string) {
        switch (newValue) {
            case 'admin':
            case 'areas':
            case 'shifts':
            case 'volunteers':
                route(`/schedule/${props.event}/${newValue}/`);
                break;

            default:
                route(`/schedule/${props.event}/`);
                break;
        }
    }

    return (
        <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }} elevation={3}>
            <BottomNavigation onChange={activateItem} value={props.active}>
                <BottomNavigationAction label="Overview"
                                        value="overview"
                                        icon={ <HomeIcon /> } />
                <BottomNavigationAction label="Shifts"
                                        value="shifts"
                                        icon={shiftsIcon} />
                <BottomNavigationAction label="Events"
                                        value="areas"
                                        icon={eventsIcon} />
                <BottomNavigationAction label="Volunteers"
                                        value="volunteers"
                                        icon={volunteersIcon} />
                { props.showAdministration &&
                    <BottomNavigationAction label="Admin"
                                            value="admin"
                                            icon={ <SettingsIcon /> } /> }
            </BottomNavigation>
        </Paper>
    );
}
