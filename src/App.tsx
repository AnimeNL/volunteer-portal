// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { Component, h } from 'preact';
import { Router, RouterOnChangeArgs, Route, route } from 'preact-router';

import { AppContext, IAppContext } from './AppContext';
import { AppError } from './AppError';
import { Cache } from './base/Cache';
import { ConfigurationImpl } from './base/ConfigurationImpl';
import { ContentImpl } from './base/ContentImpl';
import { EnvironmentImpl } from './base/EnvironmentImpl';
import { EventFactory } from './base/EventFactory';
import { UserImpl, UserImplObserver } from './base/UserImpl';

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
export class App extends Component<{}, AppState> implements UserImplObserver {
    private cache: Cache;
    private configuration: ConfigurationImpl;
    private content: ContentImpl;
    private environment: EnvironmentImpl;
    private eventFactory: EventFactory;
    private user: UserImpl;

    public appContext: IAppContext;
    public state: AppState = {
        authenticated: false,
        loaded: false,
    };

    constructor() {
        super();

        this.cache = new Cache();
        this.configuration = new ConfigurationImpl();
        this.content = new ContentImpl(this.cache, this.configuration);
        this.environment = new EnvironmentImpl(this.cache, this.configuration);
        this.eventFactory = new EventFactory(this.cache, this.configuration);
        this.user = new UserImpl(this.cache, this.configuration);

        // Compose the app context. Preact uses instance equality to determine whether the context
        // changed, so we'll want to ensure the same instance will be reused when possible.
        this.appContext = {
            configuration: this.configuration,
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
        const [ contentInitialized, environmentInitialized, _ ] = await Promise.all([
            this.content.initialize(),
            this.environment.initialize(),
            this.user.initialize(),
        ]);

        this.user.addObserver(this);

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

    // Called when the <App> component is being removed. Stops observing the UserImpl object.
    componentWillUnmount() {
        this.user.removeObserver(this);
    }

    // ---------------------------------------------------------------------------------------------
    // State observers.
    // ---------------------------------------------------------------------------------------------

    onAuthenticationStateChanged() {
        this.appContext.event = undefined;
        this.setState({
            authenticated: this.user.authenticated,
        });
    }

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

        const event = await this.eventFactory.load(this.user.authToken, identifier);
        if (!event) {
            document.location.href = '/';
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
                        <Route path="/registration/:event*" component={RegistrationApp} />

                        { /* The schedule is only available for authenticated users. */ }
                        { this.state.authenticated &&
                            <Route path="/schedule/:identifier/:request*" component={ScheduleApp} /> }

                        <Route default component={WelcomeApp} />
                    </Router>
                }
                { !this.state.loaded && <LoadingApp /> }
            </AppContext.Provider>
        );
    }
}
