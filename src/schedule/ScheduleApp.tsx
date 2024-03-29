// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { Component, h } from 'preact';
import { Router, Route } from 'preact-router';
import { useContext } from 'preact/hooks';

import Box from '@mui/material/Box';
import Hidden from '@mui/material/Hidden';
import Stack from '@mui/material/Stack';
import { SystemStyleObject, Theme } from '@mui/system';

import { AppContext } from '../AppContext';
import { ApplicationBar } from './components/ApplicationBar';
import { ContentTheme } from '../ContentTheme';
import { DateTime } from '../base/DateTime';
import { DesktopNavigation } from './components/DesktopNavigation';
import { EventTrackerImpl } from '../base/EventTrackerImpl';
import type { Event } from '../base/Event';
import { Invalidatable } from '../base/Invalidatable';
import { MobileNavigation } from './components/MobileNavigation';
import { NavigationActiveOptions } from './components/Navigation';
import { Timer } from '../base/Timer';
import { User } from '../base/User';

import { ActiveEventsView } from './views/ActiveEventsView';
import { AdministratorView } from './views/AdministratorView';
import { EventListView } from './views/EventListView';
import { EventView } from './views/EventView';
import { LocationListView } from './views/LocationListView';
import { OverviewView } from './views/OverviewView';
import { VolunteerListView } from './views/VolunteerListView';
import { VolunteerView } from './views/VolunteerView';

import { kDesktopMaximumWidthPx, kDesktopMenuWidthPx } from './ResponsiveConstants';

// Interval, in milliseconds, between which we should request event updates from the network.
const kEventInvalidationIntervalMs = 5 /* =minutes */ * 60 * 1000;

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

        colorScheme: 'light only',
    },
}

// Properties accepted by the <ScheduleApp> component.
export interface ScheduleAppProps {
    // The Event instance that has been loaded for the schedule.
    event: Event;

    // Identifier of the event to load. Retrieved from the URL. Data for this event will already
    // have been loaded by the <App> component, before routing the request to us.
    identifier: string;

    // Remainder of the request path, i.e. the portion that follows after the event identifier. Any
    // subsequent navigation within the schedule should be done based on this location.
    request?: string;

    // The user for whom the schedule is being displayed. This is used to compute their volunteer
    // instance, used commonly throughout the app.
    user: User;
}

// State maintained by the <ScheduleApp> component. This generally reflects state of the event that
// is being displayed within the application.
interface ScheduleAppState {
    // The DateTime which is current at the time the schedule application last processed an update.
    dateTime: DateTime;

    // The EventTrackerImpl which has been updated to the given |dateTime|.
    eventTracker: EventTrackerImpl;
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
        implements Invalidatable {

    // Timer responsible for forwarding the internal DateTime instance based on program updates.
    #refreshDateTimeTimer: Timer;

    // Timer responsible for refreshing the event information from the network.
    #refreshEventTimer: Timer;

    public state: ScheduleAppState;

    constructor(props: ScheduleAppProps) {
        super();

        this.#refreshEventTimer = new Timer(this.handleRefreshEvent);
        this.#refreshDateTimeTimer = new Timer(this.handleRefreshDateTime);

        const eventTracker = new EventTrackerImpl(props.event, props.user);
        const dateTime = DateTime.local();

        eventTracker.update(dateTime);

        this.state = { dateTime, eventTracker }
    }

    // ---------------------------------------------------------------------------------------------
    // Invalidatable implementation
    // ---------------------------------------------------------------------------------------------

    // Called when the event has been invalidated, i.e. because an update was fetched from the
    // network. This will lead to the EventTracker instance ot be updated.
    invalidate() {
        const currentTime = DateTime.local();

        this.state.eventTracker.update(currentTime);
        this.setState({ dateTime: currentTime });
    }

    // ---------------------------------------------------------------------------------------------
    // Component and page lifetime callbacks
    // ---------------------------------------------------------------------------------------------

    // Called when the refresh event timer has fired. Will actually refresh the event information
    // from the network, and then (in parallel) schedule the timer to fire again later.
    private handleRefreshEvent = () => {
        this.props.event.refresh();
        this.#refreshEventTimer.start(kEventInvalidationIntervalMs);

        console.info('FYI: Refreshed the schedule from the network.');
    };

    // Called when the refresh DateTime timer has fired. Will forward the current local time, and
    // schedule a new program update to happen during the next invocation.
    private handleRefreshDateTime = () => {
        this.invalidate();
        this.#refreshDateTimeTimer.start(this.millisecondsUntilNextScheduleUpdate());

        console.info('FYI: Refreshed the DateTime state of the schedule app.');
    };

    // Called when the document's visibility has changed. All timers will be suspended when the
    // document has been hidden, whereas they will be resumed when the document is shown again.
    private handleVisibilityChange = () => {
        if (document.hidden) {
            this.#refreshDateTimeTimer.suspend();
            this.#refreshEventTimer.suspend();
        } else {
            this.#refreshDateTimeTimer.resumeOrRestart(this.millisecondsUntilNextScheduleUpdate());
            this.#refreshEventTimer.resumeOrRestart(kEventInvalidationIntervalMs);
        }
    };

    componentDidMount() {
        this.props.event.addObserver(this);

        this.#refreshDateTimeTimer.start(this.millisecondsUntilNextScheduleUpdate());
        this.#refreshEventTimer.start(kEventInvalidationIntervalMs);

        document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }

    componentWillUnmount() {
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);

        this.#refreshEventTimer.stop();
        this.#refreshDateTimeTimer.stop();

        this.props.event.removeObserver(this);
    }

    // Calculates the number of milliseconds until the next program update. If there won't be any
    // more updates, for example because the event has finished, we'll refresh state once per hour.
    // The diff will be clamped between [16, 60 * 60 * 1000]ms.
    private millisecondsUntilNextScheduleUpdate(): number {
        const nextUpdateDateTime = this.state.eventTracker.getNextUpdateDateTime();
        if (!nextUpdateDateTime)
            return 60 * 60 * 1000;  // one hour

        const absoluteDiff = nextUpdateDateTime.moment().diff(DateTime.local().moment());
        return Math.min(Math.max(absoluteDiff, 16), 60 * 60 * 1000);
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
        const { eventTracker, dateTime } = this.state;
        const { event, user } = this.props;

        const { environment } = useContext(AppContext);
        if (!event)
            return <></>;

        const navigationActiveOption = this.determineNavigationActiveOptions();

        // While seemingly expensive, each of these operations executes in constant time. We
        // therefore don't cache or memoize them, as that would actually lead to a regression.
        const userVolunteer = eventTracker.getUserVolunteer();
        const userVolunteerActivity =
            userVolunteer ? eventTracker.getVolunteerActivity(userVolunteer)
                          : 'unavailable';

        const badgeActiveEvents = this.state.eventTracker.getActiveSessionCount();
        const badgeActiveShifts = typeof userVolunteerActivity !== 'string';
        const badgeActiveVolunteers = this.state.eventTracker.getActiveVolunteerCount();

        return (
            <ContentTheme environment={environment}>
                <Box sx={kStyles.root}>

                    <ApplicationBar defaultTitle={`${event.name} ${environment.themeTitle}`}
                                    event={event}
                                    showAdministration={user.isAdministrator()} />

                    <Stack direction="row" sx={kStyles.container}>

                        <Hidden mdDown>
                            <Box sx={kStyles.menuAndSpacing}>
                                <DesktopNavigation active={navigationActiveOption}
                                                   badgeActiveEvents={badgeActiveEvents}
                                                   badgeActiveShifts={badgeActiveShifts}
                                                   badgeActiveVolunteers={badgeActiveVolunteers}
                                                   event={event} volunteer={userVolunteer}
                                                   showAdministration={user.isAdministrator()} />
                            </Box>
                        </Hidden>

                        <Box sx={kStyles.content}>
                            <Router>
                                { user.isAdministrator() &&
                                    <Route path="/schedule/:identifier/admin/" component={AdministratorView} app={this} /> }

                                <Route path="/schedule/:identifier/events/:area/:location/"
                                       component={EventListView} dateTime={dateTime} event={event} />
                                <Route path="/schedule/:identifier/events/:area/"
                                       component={LocationListView} dateTime={dateTime} event={event} />
                                <Route path="/schedule/:identifier/events/"
                                       component={ActiveEventsView} dateTime={dateTime} eventTracker={eventTracker} event={event} />
                                <Route path="/schedule/:identifier/event/:eventIdentifier/"
                                       component={EventView} dateTime={dateTime} event={event} />
                                <Route path="/schedule/:identifier/shifts/"
                                       component={VolunteerView} dateTime={dateTime} eventTracker={eventTracker} event={event} />
                                <Route path="/schedule/:identifier/volunteers/:volunteerIdentifier/"
                                       component={VolunteerView} dateTime={dateTime} eventTracker={eventTracker} event={event} />
                                <Route path="/schedule/:identifier/volunteers/"
                                       component={VolunteerListView} dateTime={dateTime} eventTracker={eventTracker} event={event} />

                                <Route default component={OverviewView} dateTime={dateTime} eventTracker={eventTracker} event={event} />
                            </Router>
                        </Box>

                    </Stack>

                    <Hidden mdUp>
                        <MobileNavigation active={navigationActiveOption}
                                          badgeActiveEvents={badgeActiveEvents}
                                          badgeActiveShifts={badgeActiveShifts}
                                          badgeActiveVolunteers={badgeActiveVolunteers}
                                          event={event} volunteer={userVolunteer} />
                    </Hidden>

                </Box>
            </ContentTheme>
        );
    }
}
