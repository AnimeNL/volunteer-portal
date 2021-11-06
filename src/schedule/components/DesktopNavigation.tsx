// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { Fragment, h } from 'preact';
import { useContext } from 'preact/hooks';

import AccessTimeIcon from '@mui/icons-material/AccessTime';
import Box from '@mui/material/Box';
import EventNoteIcon from '@mui/icons-material/EventNote';
import GroupIcon from '@mui/icons-material/Group';
import HomeIcon from '@mui/icons-material/Home';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import SettingsIcon from '@mui/icons-material/Settings';
import { SystemStyleObject, Theme } from '@mui/system';
import { darken, lighten, styled } from '@mui/material/styles';

import { AppContext } from '../../AppContext';
import { NavigationActiveOptions, NavigationProps, navigateToOption } from './Navigation';
import { kDesktopMenuWidthPx } from '../ResponsiveConstants';

// Styling for the <DesktopNavigation> component. List items are changed to be round (as is the
// case in Material You), paddings and colours are adjusted.
const kStyles: Record<string, SystemStyleObject<Theme>> = {
    container: {
        paddingRight: 2,
    },
    header: {
        borderRadius: 1,
        width: `${kDesktopMenuWidthPx - 16}px`,
        height: `${kDesktopMenuWidthPx / 2}px`,
        overflow: 'hidden',
        marginTop: 2,
        marginBottom: 1,
    },
    item: {
        borderRadius: '32px',
        marginBottom: 1,
    },
};

// Component for displaying a badge with textual content, generally a number.
const NumberBadge = styled(Box)(({ theme }) => ({
    backgroundColor: theme.palette.error.main,
    color: theme.palette.getContrastText(theme.palette.error.main),
    padding: theme.spacing(0.125, 1),
    borderRadius: theme.spacing(1),
    fontSize: theme.spacing(1.5),
    lineHeight: theme.spacing(2.25),
    marginTop: theme.spacing(-1),
    pointerEvents: 'none',
}));

// Component for displaying a badge that has no content, other than an indicator.
const SolidBadge = styled(Box)(({ theme }) => ({
    backgroundColor: theme.palette.error.main,
    width: theme.spacing(1),
    height: theme.spacing(1),
    borderRadius: theme.spacing(.5),
    marginTop: theme.spacing(-1),
    pointerEvents: 'none',
}));

// Interface that defines the structure of each predefined navigation option.
interface NavigationOption {
    id: NavigationActiveOptions,
    label: string,
    icon: h.JSX.Element,
    badge: React.ReactNode,
};

// This component powers the main navigation capability of the volunteer portal, with a user
// interface optimized for display on mobile devices. A list that can be shown on the left- or
// right-hand side of the main content, to make better use of the available screen estate, without
// polluting it with a full side-drawer.
export function DesktopNavigation(props: NavigationProps) {
    const { environment } = useContext(AppContext);

    const options: NavigationOption[] = [
        {
            id: 'overview',
            label: 'Overview',
            icon: <HomeIcon />,
            badge: null,
        },
        {
            id: 'shifts',
            label: 'Your shifts',
            icon: <AccessTimeIcon />,
            badge: props.badgeActiveShifts && <SolidBadge />,
        },
        {
            id: 'areas',
            label: 'Events',
            icon: <EventNoteIcon />,
            badge: props.badgeActiveEvents &&
                       <NumberBadge>{props.badgeActiveEvents}</NumberBadge>,
        },
        {
            id: 'volunteers',
            label: 'Volunteers',
            icon: <GroupIcon />,
            badge: props.badgeActiveVolunteers &&
                       <NumberBadge>{props.badgeActiveVolunteers}</NumberBadge>,
        },
    ];

    if (props.showAdministration) {
        options.push({
            id: 'admin',
            label: 'Administration',
            icon: <SettingsIcon />,
            badge: null,
        });
    }

    const navigateFn = navigateToOption.bind(null, props.event);
    const params = new URLSearchParams([
        [ 'color', darken(environment.themeColor, .3) ],
        [ 'title', /* the empty string= */ '' ],
    ]);

    return (
        <Fragment>
            <Box sx={{ ...kStyles.header, backgroundColor: lighten(environment.themeColor, .7) }}>
                <object type="image/svg+xml" style="margin-top: -35px"
                        data={'/images/logo.svg?' + params}
                        alt="J-POP Logo" />
            </Box>
            <List sx={kStyles.container}>
                { options.map(option =>
                    <ListItem disablePadding secondaryAction={option.badge}>
                        <ListItemButton onClick={ _ => navigateFn(option.id) }
                                        selected={props.active === option.id}
                                        sx={kStyles.item}>
                            <ListItemIcon>
                                {option.icon}
                            </ListItemIcon>
                            <ListItemText primary={option.label} />
                        </ListItemButton>
                    </ListItem>) }
            </List>
        </Fragment>
    );
}
