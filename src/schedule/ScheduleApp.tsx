// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { Component, h } from 'preact';
import { Router, Route } from 'preact-router';
import { useContext, useEffect } from 'preact/hooks';

import Box from '@mui/material/Box';
import Hidden from '@mui/material/Hidden';
import Stack from '@mui/material/Stack';
import { SystemStyleObject, Theme } from '@mui/system';

import { AppContext } from '../AppContext';
import { AppTitleListener, clearTitleListener, setTitleListener } from '../AppTitle';
import { ApplicationBar } from './components/ApplicationBar';
import { ContentTheme } from '../ContentTheme';
import { DesktopNavigation } from './components/DesktopNavigation';
import { MobileNavigation } from './components/MobileNavigation';
import { NavigationActiveOptions } from './components/Navigation';

import { ActiveEventsView } from './views/ActiveEventsView';
import { AdministratorView } from './views/AdministratorView';
import { EventListView } from './views/EventListView';
import { EventView } from './views/EventView';
import { LocationListView } from './views/LocationListView';
import { OverviewView } from './views/OverviewView';
import { VolunteerListView } from './views/VolunteerListView';
import { VolunteerView } from './views/VolunteerView';

import { kDesktopMaximumWidthPx, kDesktopMenuWidthPx } from './ResponsiveConstants';

// Styling for the <ScheduleApp> component. See the component-level comment for a description of the
// responsive behaviour that this component implements, which this styling exists to enable.
const kStyles: Record<string, SystemStyleObject<Theme>> = {
    container: {
        margin: 'auto',
        maxWidth: {
            md: kDesktopMaximumWidthPx,
        },
        paddingRight: {
            md: 2,
        }
    },
    content: {
        flexGrow: 1,
        maxWidth: '100%',
        width: {
            md: `calc(100% - ${2 * kDesktopMenuWidthPx}px)`,
        },
    },
    menuAndSpacing: {
        width: kDesktopMenuWidthPx,
    },
    root: {
        minHeight: '100vh',
        paddingBottom: {
            xs: '48px',  // height of the mobile navigation bar
            md: '8px',  // single spacing
        },

        backgroundColor: theme => {
            return theme.palette.mode === 'light' ? '#F5F5F5'   // Gray 50
                                                  : '#212121';  // Gray 900
        },
    },
}

// Properties accepted by the <ScheduleApp> component.
export interface ScheduleAppProps {
    // Identifier of the event to load. Retrieved from the URL. Data for this event will already
    // have been loaded by the <App> component, before routing the request to us.
    identifier: string;

    // Remainder of the request path, i.e. the portion that follows after the event identifier. Any
    // subsequent navigation within the schedule should be done based on this location.
    request?: string;
}

// State maintained by the <ScheduleApp> component. This generally reflects state of the event that
// is being displayed within the application.
interface ScheduleAppState {
    // Whether Dark Mode should be enabled in the application. Will be toggled based on the device's
    // current colour mode, but can be overridden by the user as well.
    darkMode: boolean;

    // Title of the application. Visible both in the user interface and in the browser tab.
    title?: string;
}

// The <ScheduleApp> component is the base component for the scheduling application, as it will be
// used by volunteers. It has a valid Event instance containing all relevant information, and is
// aware of the volunteer for whom the schedule is being displayed as well.
//
// Supported views within this application are as follows:
//
//     /schedule/:event/                          OverviewView
//     /schedule/:event/admin/                    AdministratorView
//     /schedule/:event/events/                   ActiveEventsView
//     /schedule/:event/events/:area/             LocationListView
//     /schedule/:event/events/:area/:location/   EventListView
//     /schedule/:event/event/:identifier/        EventView
//     /schedule/:event/shifts/                   VolunteerView
//     /schedule/:event/volunteers/               VolunteerListView
//     /schedule/:event/volunteers/:identifier/   VolunteerView
//
// Routing is done using the Preact router component. Additional logic is applied to make sure that
// the <Navigation> component highlights the appropriate tile, depending on the active view.
//
// This view is responsive, in that a different layout is served to desktop users compared to
// mobile users. The following differences exist:
//
//     * On desktop, the width of the application is capped to 1200 pixels.
//     * On mobile, a bottom bar navigation will be shown, whereas on desktop the navigation will
//       be shown as a regular list-based menu on the left-hand side of the content.
//
// Individual components may have further optimizations where they make sense to support.
export class ScheduleApp extends Component<ScheduleAppProps, ScheduleAppState>
        implements AppTitleListener {

    public state: ScheduleAppState = {
        darkMode: false,
    };

    // ---------------------------------------------------------------------------------------------
    // AppTitleListener implementation & lifetime.
    // ---------------------------------------------------------------------------------------------

    // Called when the application's title has been changed. This should be reflected in the title
    // bar part of our user interface, as well as the browser's tab state.
    onAppTitleChange(newTitle?: string) {
        this.setState({
            title: newTitle,
        });
    }

    // Ensures that the title listener is active while this component has been mounted.
    componentDidMount() { setTitleListener(this); }
    componentWillUnmount() { clearTitleListener(); }

    // ---------------------------------------------------------------------------------------------
    // Setting routines.
    // ---------------------------------------------------------------------------------------------

    // Returns whether dark mode has been enabled in the application.
    getDarkMode(): boolean { return this.state.darkMode; }

    // Toggles whether dark mode should be enabled in the application. This option is considered an
    // override, and will take precedence over the device state, which is considered as a default.
    setDarkMode(enabled: boolean): void {
        // TODO: Persist |enabled|.

        this.setState({
            darkMode: !!enabled,
        });
    }

    // ---------------------------------------------------------------------------------------------
    // Navigation routines.
    // ---------------------------------------------------------------------------------------------

    // Determines the active navigation option based on the URL that's currently being displayed in
    // the scheduling application. Unknown pages will fall back to the home icon.
    determineNavigationActiveOptions(): NavigationActiveOptions {
        const view = this.props.request?.split('/').shift() ?? 'overview';
        switch (view) {
            case 'admin':
            case 'events':
            case 'shifts':
            case 'volunteers':
                return view;

            default:
                return 'overview';
        }
    }

    // ---------------------------------------------------------------------------------------------
    // Display routines.
    // ---------------------------------------------------------------------------------------------

    render() {
        const { environment, event, user } = useContext(AppContext);
        if (!event)
            return <></>;

        const defaultTitle = event.name + ' ' + environment.themeTitle;
        const navigationActiveOption = this.determineNavigationActiveOptions();

        useEffect(() => {
            if (this.state.title)
                document.title = `${this.state.title} | ${defaultTitle}`;
            else
                document.title = defaultTitle;

        }, [ this.state.title ]);

        return (
            <ContentTheme environment={environment} darkMode={this.state.darkMode}>
                <Box sx={kStyles.root}>

                    <ApplicationBar event={event}
                                    title={this.state.title || defaultTitle} />

                    <Stack direction="row" sx={kStyles.container}>

                        <Hidden mdDown>
                            <Box sx={kStyles.menuAndSpacing}>
                                <DesktopNavigation active={navigationActiveOption}
                                                   badgeActiveEvents={12}
                                                   badgeActiveShifts={true}
                                                   badgeActiveVolunteers={7}
                                                   event={event}
                                                   showAdministration={user.isAdministrator()} />
                            </Box>
                        </Hidden>

                        <Box sx={kStyles.content}>
                            <Router>
                                { user.isAdministrator() &&
                                    <Route path="/schedule/:identifier/admin/" component={AdministratorView} app={this} /> }

                                <Route path="/schedule/:identifier/events/:area/:location/" component={EventListView} event={event} />
                                <Route path="/schedule/:identifier/events/:area/" component={LocationListView} event={event} />
                                <Route path="/schedule/:identifier/events/" component={ActiveEventsView} event={event} />
                                <Route path="/schedule/:identifier/event/:eventIdentifier/" component={EventView} event={event} />
                                <Route path="/schedule/:identifier/shifts/" component={VolunteerView} event={event} />
                                <Route path="/schedule/:identifier/volunteers/:volunteerIdentifier/" component={VolunteerView} event={event} />
                                <Route path="/schedule/:identifier/volunteers/" component={VolunteerListView} event={event} />

                                <Route default component={OverviewView} />
                            </Router>
                        </Box>

                    </Stack>

                    <Hidden mdUp>
                        <MobileNavigation active={navigationActiveOption}
                                          badgeActiveEvents={12}
                                          badgeActiveShifts={true}
                                          badgeActiveVolunteers={7}
                                          event={event}
                                          showAdministration={user.isAdministrator()} />
                    </Hidden>

                </Box>
            </ContentTheme>
        );
    }
}
