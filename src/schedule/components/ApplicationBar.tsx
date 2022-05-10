// Copyright 2022 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { Fragment, h } from 'preact';
import { useContext, useEffect, useState } from 'preact/hooks';

import AccountCircle from '@mui/icons-material/AccountCircle';
import AppBar from '@mui/material/AppBar';
import IconButton from '@mui/material/IconButton';
import InputBase from '@mui/material/InputBase';
import ListItemIcon from '@mui/material/ListItemIcon';
import LogoutIcon from '@mui/icons-material/Logout';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import SearchIcon from '@mui/icons-material/Search';
import { SystemStyleObject, Theme } from '@mui/system';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { alpha, styled } from '@mui/material/styles';

import { AppContext } from '../../AppContext';
import { Event } from '../../base/Event';
import { SearchResults } from './SearchResults';
import { kDesktopMenuWidthPx, kDesktopMaximumWidthPx } from '../ResponsiveConstants';
import React from 'react';

// Containing element for the search field. Provides relative positioning, and a hover effect on
// desktop to illustrate that interaction with this element is possible.
// Based on https://mui.com/material-ui/react-app-bar/ (MIT)
const Search = styled('div')(({ theme }) => ({
    position: 'relative',
    marginLeft: theme.spacing(1),
    width: 'auto',
}));

// Containing element for the search icon, which should be visible both in the element's default
// state, as well as in the expanded state where user input is accepted.
// Based on https://mui.com/material-ui/react-app-bar/ (MIT)
const SearchIconWrapper = styled('div')(({ theme }) => ({
    pointerEvents: 'none',
    position: 'absolute',

    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',

    height: '100%',
    padding: theme.spacing(0, 2),
}));

// Input element through which the user can initiate a search. Accepts user input, and expands over
// the width of the parent <AppBar> when input is actually being accepted.
// Based on https://mui.com/material-ui/react-app-bar/ (MIT)
const StyledInputBase = styled(InputBase)(({ theme }) => ({
    color: 'inherit',

    '& .MuiInputBase-input': {
        borderRadius: theme.shape.borderRadius,
        boxSizing: 'border-box',
        cursor: 'pointer',
        padding: theme.spacing(2, 0),
        paddingLeft: `calc(1em + ${theme.spacing(4)})`,
        transition: theme.transitions.create('width'),
        width: theme.spacing(6),

        '&:focus, &[value]:not([value=""])': {
            backgroundColor: alpha(theme.palette.common.white, 0.2),
            cursor: 'text',

            // There's an additional 16 spacing of emptiness in the header: 2 on either side, 2
            // between each of the three elements (4x2=8), and an additional 8 for the search box.
            width: `calc(100vw - ${theme.spacing(16)})`,
        },

        '&:focus:hover': {
            backgroundColor: alpha(theme.palette.common.white, 0.25),
        }
    },

    [theme.breakpoints.up('md')]: {
        '& .MuiInputBase-input': {
            '&:focus, &[value]:not([value=""])': {
                width: '50vw',
            },
        },
    }
}));

// Styling used for the application bar. It's used for both the desktop view and for the mobile view
// so there will be a fair amount of branching in this code, as the actual component will be kept
// identical. (Unlike the bottom navigation drawer.)
const kStyles: Record<string, SystemStyleObject<Theme>> = {
    container: {
        display: 'block',
    },
    title: {
        flexGrow: 1,

        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    toolbar: {
        margin: 'auto',

        paddingLeft: {
            md: `${kDesktopMenuWidthPx}px`,
        },

        maxWidth: {
            md: `${kDesktopMaximumWidthPx}px`,
        },
    },
}

// Properties accepted by the <ApplicationBar> component.
export interface ApplicationBarProps {
    /**
     * The event for which the application bar is being displayed. Necessary to power the inline
     * search results functionality.
     */
    event: Event;

    /**
     * Title to display in the application bar.
     */
    title: string;
}

// The <ApplicationBar> component is the title bar of our application. It provides three main pieces
// of functionality, each of which rather critical to the volunteer portal.
//
// First, the title. This tells the user where in the application they are.
//
// Then the search bar. This can be activated, and expands in-header, to quickly search through all
// the information known to the local instance of the volunteer portal. Suggestions will be offered
// in-line, but a result page is available as well.
//
// Finally, a user menu. This allows the user to sign out of their account. More functionality may
// be added later, I just haven't thought of it yet.
export function ApplicationBar(props: ApplicationBarProps) {
    const { user } = useContext(AppContext);

    const [ searchBarAnchor, setSearchBarAnchor ] = useState<any>(null);
    const [ searchClearFocus, setSearchClearFocus ] = useState<boolean>(false);
    const [ searchQuery, setSearchQuery ] = useState<string>('');

    // Closes the search results. A double render will be done to ensure that focus is lost from the
    // search field, important when an activation has caused this to be closed.
    function closeSearchResults() {
        setSearchQuery(/* no search query = */ '');
        setSearchClearFocus(true);
    }

    useEffect(() => {
        if (searchClearFocus) {
            if (document.activeElement instanceof HTMLElement)
                document.activeElement.blur();

            setSearchClearFocus(false);
        }
    }, [ searchClearFocus ]);

    // Updates the search state when input is taken in the <StyledInputBase> element. The anchor
    // will be stored as well if it's not set to the |event|'s target yet.
    function handleSearchInput(event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) {
        setSearchQuery(event.target.value);

        if (searchBarAnchor !== event.target)
            setSearchBarAnchor(event.target);
    }

    // Captures "escape" presses by the user and closes the search result in answer to them. This
    // is a quality-of-life improvement for desktop users.
    function handleSearchKeyPress(event: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) {
        if (event.key === 'Escape')
            closeSearchResults();
    }

    const [ userMenuAnchor, setUserMenuAnchor ] = useState<any>(null);
    const [ userMenuOpen, setUserMenuOpen ] = useState(false);

    function openUserMenu(event: React.MouseEvent<HTMLButtonElement>) {
        setUserMenuAnchor(event.currentTarget);
        setUserMenuOpen(true);
    }

    function signOut() {
        setUserMenuOpen(false);
        return user.signOut();
    }

    return (
        <Fragment>
            <AppBar position="sticky" sx={kStyles.container}>
                <Toolbar sx={kStyles.toolbar}>
                    <Typography variant="h6" component="div" sx={kStyles.title}>
                        {props.title}
                    </Typography>
                    <Search>
                        <SearchIconWrapper>
                            <SearchIcon />
                        </SearchIconWrapper>
                        <StyledInputBase placeholder="Search..."
                                         inputProps={{ 'aria-label': 'search' }}
                                         onChange={handleSearchInput}
                                         onKeyUp={handleSearchKeyPress}
                                         value={searchQuery} />
                    </Search>
                    <IconButton onClick={openUserMenu} size="large" color="inherit">
                        <AccountCircle />
                    </IconButton>
                </Toolbar>
            </AppBar>

            <SearchResults anchorEl={searchBarAnchor}
                           event={props.event}
                           onClose={closeSearchResults}
                           query={searchQuery} />

            <Menu anchorEl={userMenuAnchor}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                  onClose={() => setUserMenuOpen(false)}
                  open={userMenuOpen}>

                <MenuItem onClick={signOut}>
                    <ListItemIcon>
                        <LogoutIcon />
                    </ListItemIcon>
                    Sign out
                </MenuItem>

            </Menu>
        </Fragment>
    );
}
