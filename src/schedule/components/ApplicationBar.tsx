// Copyright 2022 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { Fragment, h } from 'preact';
import { route } from 'preact-router';
import { useContext, useEffect, useRef, useState } from 'preact/hooks';

import AccountCircle from '@mui/icons-material/AccountCircle';
import AppBar from '@mui/material/AppBar';
import ButtonGroup from '@mui/material/ButtonGroup';
import Button from '@mui/material/Button';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import Divider from '@mui/material/Divider';
import Hidden from '@mui/material/Hidden';
import IconButton from '@mui/material/IconButton';
import InputBase from '@mui/material/InputBase';
import LightModeIcon from '@mui/icons-material/LightMode';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import LogoutIcon from '@mui/icons-material/Logout';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import SearchIcon from '@mui/icons-material/Search';
import SettingsBrightnessIcon from '@mui/icons-material/SettingsBrightness';
import SettingsIcon from '@mui/icons-material/Settings';
import { SystemStyleObject, Theme } from '@mui/system';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { alpha, styled } from '@mui/material/styles';

import { AppContext } from '../../AppContext';
import { type AppThemeState, getApplicationThemeState,
         setApplicationThemeState } from '../../ContentTheme';
import { Event } from '../../base/Event';
import { SearchResults } from './SearchResults';
import { clearTitleListener, setTitleListener } from '../../AppTitle';
import { kDesktopMenuWidthPx, kDesktopMaximumWidthPx } from '../ResponsiveConstants';

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
     * Default title to display in the application bar.
     */
    defaultTitle: string;

    /**
     * Whether the administration option should be displayed.
     */
    showAdministration?: boolean;
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
    const { defaultTitle } = props;
    const { user } = useContext(AppContext);

    const [ title, setTitle ] = useState<string>(defaultTitle);
    useEffect(() => {
        setTitleListener(updatedTitle => {
            setTitle(updatedTitle || defaultTitle);

            document.title = updatedTitle ? `${updatedTitle} | ${defaultTitle}`
                                          : defaultTitle;
        });

        return () => clearTitleListener();

    }, [ props.defaultTitle ]);

    const [ searchBarAnchor, setSearchBarAnchor ] = useState<any>(null);
    const [ searchClearFocus, setSearchClearFocus ] = useState<boolean>(false);
    const [ searchCommit, setSearchCommit ] = useState<boolean>(false);
    const [ searchQuery, setSearchQuery ] = useState<string>('');

    // Closes the search results. A double render will be done to ensure that focus is lost from the
    // search field, important when an activation has caused this to be closed.
    function closeSearchResults() {
        setSearchQuery(/* no search query = */ '');
        setSearchCommit(false);
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
        if (event.key === 'Enter')
            setSearchCommit(true);

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

    function handleAdministration() {
        setUserMenuOpen(false);
        route(`/schedule/${props.event.identifier}/admin/`);
    }

    // Allows <ctrl+f> to be captured for keyboard-based users, as a shortcut to quickly search
    // through the event. Pages generally aren't compilicated enough to need Find in Page.
    const searchBarRef = useRef<HTMLInputElement>();

    useEffect(() => {
        function interceptSearchKey(event: KeyboardEvent): void {
            if (!searchBarRef.current)
                return;

            if (!event.ctrlKey || event.keyCode !== /* f= */ 70)
                return;

            event.preventDefault();
            searchBarRef.current.focus();
        }

        window.addEventListener('keydown', interceptSearchKey);
        return () => window.removeEventListener('keydown', interceptSearchKey);
    });

    // Dark Mode of the application is controlled by the <ContentTheme> component, which also
    // provides persistence of the configuration. A local state is used to allow the buttons to
    // update immediately, as a form of user interaction feedback.
    const [ darkModeState, setDarkModeState ] = useState(getApplicationThemeState());

    function updateDarkModeState(state: AppThemeState): void {
        setApplicationThemeState(state);
        setDarkModeState(state);
    }

    return (
        <Fragment>
            <AppBar position="sticky" sx={kStyles.container}>
                <Toolbar sx={kStyles.toolbar}>
                    <Typography variant="h6" component="div" sx={kStyles.title}>
                        {title}
                    </Typography>
                    <Search>
                        <SearchIconWrapper>
                            <SearchIcon />
                        </SearchIconWrapper>
                        <StyledInputBase placeholder="Search..."
                                         inputProps={{ 'aria-label': 'search' }}
                                         inputRef={searchBarRef}
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
                           commit={searchCommit}
                           event={props.event}
                           onClose={closeSearchResults}
                           query={searchQuery} />

            <Menu anchorEl={userMenuAnchor}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                  onClose={() => setUserMenuOpen(false)}
                  open={userMenuOpen}>

                <MenuItem disableRipple disableTouchRipple>
                    <ButtonGroup variant="outlined">
                        <Button variant={ darkModeState === 'light' ? 'contained' : 'outlined' }
                                onClick={ () => updateDarkModeState('light') }>
                            <LightModeIcon fontSize="small" />
                        </Button>
                        <Button variant={ darkModeState === 'auto' ? 'contained' : 'outlined' }
                                onClick={ () => updateDarkModeState('auto') }>
                            <SettingsBrightnessIcon fontSize="small" />
                        </Button>
                        <Button variant={ darkModeState === 'dark' ? 'contained' : 'outlined' }
                                onClick={ () => updateDarkModeState('dark') }>
                            <DarkModeIcon fontSize="small" />
                        </Button>
                    </ButtonGroup>
                </MenuItem>

                <Divider />

                { props.showAdministration &&
                    <Hidden mdUp>
                        <MenuItem dense onClick={handleAdministration}>
                            <ListItemIcon>
                                <SettingsIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText>
                                Administration
                            </ListItemText>
                        </MenuItem>
                    </Hidden> }

                <MenuItem dense onClick={signOut}>
                    <ListItemIcon>
                        <LogoutIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>
                        Sign out
                    </ListItemText>
                </MenuItem>

            </Menu>
        </Fragment>
    );
}
