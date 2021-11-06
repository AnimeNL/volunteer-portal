// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { Component, h } from 'preact';
import { Router, Route } from 'preact-router';
import { useContext, useEffect } from 'preact/hooks';

import { AppContext } from '../AppContext';
import { AppTitleListener, clearTitleListener, setTitleListener } from '../AppTitle';
import { ApplicationBar } from './components/ApplicationBar';
import { ContentTheme } from '../ContentTheme';
import { NavigationActiveOptions, Navigation } from './components/Navigation';

import { AdministratorView } from './views/AdministratorView';
import { AreaListView } from './views/AreaListView';
import { EventListView } from './views/EventListView';
import { LocationListView } from './views/LocationListView';
import { OverviewView } from './views/OverviewView';
import { SearchResultsView } from './views/SearchResultsView';
import { VolunteerListView } from './views/VolunteerListView';
import { VolunteerView } from './views/VolunteerView';

// Properties accepted by the <ScheduleApp> component.
export interface ScheduleAppProps {
    // Identifier of the event to load. Retrieved from the URL. Data for this event will already
    // have been loaded by the <App> component, before routing the request to us.
    event: string;

    // Remainder of the request path, i.e. the portion that follows after the event identifier. Any
    // subsequent navigation within the schedule should be done based on this location.
    request?: string;
}

// State maintained by the <ScheduleApp> component. This generally reflects state of the event that
// is being displayed within the application.
interface ScheduleAppState {
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
//     /schedule/:event/areas/                    AreaListView
//     /schedule/:event/areas/:area/              LocationListView
//     /schedule/:event/areas/:area/:location/    EventListView
//     /schedule/:event/search/:query             SearchResultsView
//     /schedule/:event/shifts/                   VolunteerView
//     /schedule/:event/volunteers/               VolunteerListView
//     /schedule/:event/volunteers/:identifier/   VolunteerView
//
// Routing is done using the Preact router component. Additional logic is applied to make sure that
// the <Navigation> component highlights the appropriate tile, depending on the active view.
export class ScheduleApp extends Component<ScheduleAppProps, ScheduleAppState>
        implements AppTitleListener {

    public state: ScheduleAppState = { /* empty */ };

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
    // Navigation routines.
    // ---------------------------------------------------------------------------------------------

    // Determines the active navigation option based on the URL that's currently being displayed in
    // the scheduling application. Unknown pages will fall back to the home icon.
    determineNavigationActiveOptions(): NavigationActiveOptions {
        const view = this.props.request?.split('/').shift() ?? 'overview';
        switch (view) {
            case 'admin':
            case 'areas':
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
            <ContentTheme environment={environment}>

                <ApplicationBar title={this.state.title || defaultTitle} />

                <Router>
                    { user.isAdministrator() &&
                        <Route path="/schedule/:event/admin/" component={AdministratorView} /> }

                    <Route path="/schedule/:event/areas/:area/:location/" component={EventListView} />
                    <Route path="/schedule/:event/areas/:area/" component={LocationListView} />
                    <Route path="/schedule/:event/areas/" component={AreaListView} />
                    <Route path="/schedule/:event/search/:query*" component={SearchResultsView} />
                    <Route path="/schedule/:event/shifts/" component={VolunteerView} />
                    <Route path="/schedule/:event/volunteers/:identifier/" component={VolunteerView} />
                    <Route path="/schedule/:event/volunteers/" component={VolunteerListView} />

                    <Route default component={OverviewView} />
                </Router>

                <Navigation active={navigationActiveOption}
                            badgeActiveEvents={12}
                            badgeActiveShifts={true}
                            badgeActiveVolunteers={7}
                            event={this.props.event}
                            showAdministration={user.isAdministrator()} />

            </ContentTheme>
        );
    }
}
