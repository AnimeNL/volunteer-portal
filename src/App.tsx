// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { Component, h } from 'preact';
import { Router, RouterOnChangeArgs, Route } from 'preact-router';
import { get as kvGet } from 'idb-keyval';

import { AppContext, IAppContext } from './AppContext';
import { AppError } from './AppError';
import { ContentImpl } from './base/ContentImpl';
import { DateTime, kDateOverrideStorageKey } from './base/DateTime';
import { EnvironmentImpl } from './base/EnvironmentImpl';
import { EventImpl } from './base/EventImpl';
import { Invalidatable } from './base/Invalidatable';
import { UserImpl } from './base/UserImpl';

import { DisplayApp } from './display/DisplayApp';
import { LoadingApp } from './loading/LoadingApp';
import { RegistrationApp } from './registration/RegistrationApp';
import { ScheduleApp } from './schedule/ScheduleApp';
import { WelcomeApp } from './welcome/WelcomeApp';

// High-level state of the application. We primarily care about whether the user has authenticated,
// as routing will enable navigation to take place otherwise.
interface AppState {
    authenticated: boolean;
    error?: string;
    loaded: boolean;
}

// Main component of the Volunteer Portal application, which creates the app context and switches
// between the four main sub-applications: Registration, Schedule and Welcome.
export class App extends Component<{}, AppState> implements Invalidatable {
    private content: ContentImpl;
    private environment: EnvironmentImpl;
    private user: UserImpl;

    public appContext: IAppContext;
    public state: AppState = {
        authenticated: false,
        loaded: false,
    };

    constructor() {
        super();

        this.content = new ContentImpl(/* observer= */ this);
        this.environment = new EnvironmentImpl(/* observer= */ this);
        this.user = new UserImpl(/* observer= */ this);

        // Compose the app context. Preact uses instance equality to determine whether the context
        // changed, so we'll want to ensure the same instance will be reused when possible.
        this.appContext = {
            content: this.content,
            environment: this.environment,
            user: this.user,
        };
    }

    // ---------------------------------------------------------------------------------------------
    // Loading routines.
    // ---------------------------------------------------------------------------------------------

    // Initializes the main application state. This is an asynchronous process that may include
    // several network fetches. Generally this is not encouraged.
    async componentWillMount() {
        const [ contentInitialized, environmentInitialized, _, timeOverrideMs ] = await Promise.all([
            this.content.initialize(),
            this.environment.initialize(),
            this.user.initialize(),
            kvGet(kDateOverrideStorageKey),
        ]);

        if (timeOverrideMs)
            DateTime.setOverrideDiff(timeOverrideMs);

        if (!environmentInitialized) {
            this.setState({ error: `Unable to initialize the portal's environment.` });
        } else if (!contentInitialized) {
            this.setState({ error: `Unable to initialize the portal's content.` });
        } else {
            this.setState({
                authenticated: this.user.authenticated,
                loaded: true,
            });
        }
    }

    // ---------------------------------------------------------------------------------------------
    // Invalidatable implementation.
    // ---------------------------------------------------------------------------------------------

    // Called when one of the data sources has been invalidated. This can mean that new data has
    // been fetched from the server, but it can also mean that the user has been signed out. Calls
    // made before the application has loaded will be ignored.
    invalidate() {
        if (!this.state.loaded)
            return;

        if (this.state.authenticated !== this.user.authenticated)
            this.setState({ authenticated: this.user.authenticated });

        this.forceUpdate();
    }

    // ---------------------------------------------------------------------------------------------
    // Navigation observer.
    // ---------------------------------------------------------------------------------------------

    async onNavigate(routerChange: RouterOnChangeArgs) {
        const matches = routerChange.url.match(/^\/schedule\/([^\/]+)\//);
        if (!matches || matches.length < 2 || !this.user.authenticated)
            return;  // the page does not require an event

        if (!this.state.loaded && routerChange.url !== routerChange.previous)
            return;  // something is already being loaded

        const identifier = matches[1];
        if (this.appContext.event && this.appContext.event.identifier === identifier)
            return;  // the event has already been loaded

        this.setState({ loaded: false });

        const event = new EventImpl({
            authToken: this.user.authToken,
            event: identifier
        });

        if (!await event.initialize()) {
            this.setState({ error: 'Unable to initialize the event information' });
            return;
        }

        this.setState({ loaded: true });
        this.appContext.event = event;
    }

    // ---------------------------------------------------------------------------------------------
    // Display routines.
    // ---------------------------------------------------------------------------------------------

    // Renders the main app. Provides the context, and then switches between the sub-application
    // that should be presented to the user.
    render() {
        return (
            <AppContext.Provider value={ this.appContext }>
                { this.state.error && <AppError error={this.state.error} /> }
                { this.state.loaded &&
                    <Router onChange={ event => this.onNavigate(event) }>
                        <Route path="/display/:identifier*" component={DisplayApp} />
                        <Route path="/registration/:event*" component={RegistrationApp} />

                        { /* The schedule is only available for authenticated users. */ }
                        { (this.state.authenticated && this.appContext.event) &&
                            <Route path="/schedule/:identifier/:request*"
                                   component={ScheduleApp}
                                   event={this.appContext.event}
                                   user={this.appContext.user} /> }

                        <Route default component={WelcomeApp} />
                    </Router>
                }
                { !this.state.loaded && <LoadingApp /> }
            </AppContext.Provider>
        );
    }
}
