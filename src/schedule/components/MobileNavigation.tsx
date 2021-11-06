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
import Paper from '@mui/material/Paper';
import SettingsIcon from '@mui/icons-material/Settings';

import { NavigationProps, navigateToOption } from './Navigation';

// This component powers the main navigation capability of the volunteer portal, with a user
// interface optimized for display on mobile devices. A bottom bar navigation will be displayed, in
// which the active item will be highlighted. Administrators get an additional option.
//
// https://mui.com/components/bottom-navigation/
export function MobileNavigation(props: NavigationProps) {
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

    const navigateFn = navigateToOption.bind(null, props.event);

    return (
        <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }} elevation={3}>
            <BottomNavigation onChange={(e, value) => navigateFn(value)} value={props.active}>
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
