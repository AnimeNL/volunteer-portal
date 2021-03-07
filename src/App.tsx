// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { Component, h } from 'preact';
import { Router, Route } from 'preact-router';

import { AppContext, IAppContext } from './AppContext';
import { AppError } from './AppError';
import { Cache } from './base/Cache';
import { ConfigurationImpl } from './base/ConfigurationImpl';
import { ContentImpl } from './base/ContentImpl';
import { EnvironmentImpl } from './base/EnvironmentImpl';
import { UserImpl, UserImplObserver } from './base/UserImpl';

import { LoadingApp } from './loading/LoadingApp';
import { PortalApp } from './portal/PortalApp';
import { RegistrationApp } from './registration/RegistrationApp';
import { WelcomeApp } from './welcome/WelcomeApp';

// High-level state of the application. We primarily care about whether the user has authenticated,
// as routing will enable navigation to take place otherwise.
interface AppState {
    authenticated: boolean;
    error?: string;
    loaded: boolean;
}

// Main component of the Volunteer Portal application, which creates the app context and switches
// between the four main sub-applications: Portal, Registration and Welcome.
export class App extends Component<{}, AppState> implements UserImplObserver {
    private cache: Cache;
    private configuration: ConfigurationImpl;
    private content: ContentImpl;
    private environment: EnvironmentImpl;
    private user: UserImpl;

    public state: AppState;

    constructor() {
        super();

        this.cache = new Cache();
        this.configuration = new ConfigurationImpl();
        this.content = new ContentImpl(this.cache, this.configuration);
        this.environment = new EnvironmentImpl(this.cache, this.configuration);
        this.user = new UserImpl(this.cache, this.configuration);

        // Initial state of the application. The actual state will be loaded and processed when the
        // component gets mounted. Once finished, a re-render will be requested as appropriate.
        this.state = {
            authenticated: false,
            loaded: false,
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

        if (!environmentInitialized)
            this.setState({ error: `Unable to initialize the portal's environment.` });
        else if (!contentInitialized)
            this.setState({ error: `Unable to initialize the portal's content.` });
        else
            this.setState({ loaded: true });
    }

    // Called when the <App> component is being removed. Stops observing the UserImpl object.
    componentWillUnmount() {
        this.user.removeObserver(this);
    }

    // ---------------------------------------------------------------------------------------------
    // State observers.
    // ---------------------------------------------------------------------------------------------

    onAuthenticationStateChanged() {
        this.setState({
            authenticated: this.user.authenticated
        });
    }

    // ---------------------------------------------------------------------------------------------
    // Display routines.
    // ---------------------------------------------------------------------------------------------

    // Composes the properties that together create for the app context. This enables the full
    // system to access these global application properties.
    composeAppContext(): IAppContext {
        return {
            configuration: this.configuration,
            content: this.content,
            environment: this.environment,
            user: this.user,
        }
    }

    // Renders the main app. Provides the context, and then switches between the sub-application
    // that should be presented to the user.
    render() {
        return (
            <AppContext.Provider value={ this.composeAppContext() }>
                { this.state.error && <AppError error={this.state.error} /> }
                { this.state.loaded &&
                    <Router>
                        <Route path="/registration/:event*" component={RegistrationApp} />

                        { this.state.authenticated && <Route default component={PortalApp} /> }
                        { !this.state.authenticated && <Route default component={WelcomeApp} /> }
                    </Router>
                }
                { !this.state.loaded && <LoadingApp /> }
            </AppContext.Provider>
        );
    }
}
