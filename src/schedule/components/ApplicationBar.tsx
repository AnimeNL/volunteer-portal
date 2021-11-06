// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { h } from 'preact';

import AccountCircle from '@mui/icons-material/AccountCircle';
import AppBar from '@mui/material/AppBar';
import IconButton from '@mui/material/IconButton';
import SearchIcon from '@mui/icons-material/Search';
import { SystemStyleObject, Theme } from '@mui/system';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';

// Styling used for the application bar. It's used for both the desktop view and for the mobile view
// so there will be a fair amount of branching in this code, as the actual component will be kept
// identical. (Unlike the bottom navigation drawer.)
const kStyles: Record<string, SystemStyleObject<Theme>> = {
    title: {
        flexGrow: 1,

        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    toolbar: {
        width: {
            md: 900,
        },
        margin: {
            md: 'auto',
        }
    },
}

// Properties accepted by the <ApplicationBar> component.
export interface ApplicationBarProps {
    // Title to display in the application bar.
    title: string;
}

export function ApplicationBar(props: ApplicationBarProps) {
    return (
        <AppBar position="static">
            <Toolbar sx={kStyles.toolbar}>
                <Typography variant="h6" component="div" sx={kStyles.title}>
                    {props.title}
                </Typography>
                <IconButton size="large" color="inherit">
                    <SearchIcon />
                </IconButton>
                <IconButton size="large" color="inherit">
                    <AccountCircle />
                </IconButton>
            </Toolbar>
        </AppBar>
    );
}