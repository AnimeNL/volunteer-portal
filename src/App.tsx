// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { Component, h } from 'preact';

import { AppContext, IAppContext } from './AppContext';
import { AppError } from './AppError';
import { Configuration } from './base/Configuration';
import { ConfigurationImpl } from './base/ConfigurationImpl';
import { Environment } from './base/Environment';
import { EnvironmentImpl } from './base/EnvironmentImpl';

import { LoadingApp } from './loading/LoadingApp';
import { WelcomeApp } from './welcome/WelcomeApp';

// High-level state of the application. We care about two primary properties: whether the user is
// authenticated, and which sub-application should be loaded.
interface AppState {
    app: 'loading' | 'portal' | 'registration' | 'welcome';
    authenticated: boolean;
    error?: string;
}

// Main component of the Volunteer Portal application, which creates the app context and switches
// between the four main sub-applications: Portal, Registration and Welcome.
export class App extends Component<{}, AppState> {
    private configuration: ConfigurationImpl;
    private environment: EnvironmentImpl;

    public state: AppState;

    constructor() {
        super();

        this.configuration = new ConfigurationImpl();
        this.environment = new EnvironmentImpl(this.configuration);

        // Initial state of the application. The actual state will be loaded and processed when the
        // component gets mounted. Once finished, a re-render will be requested as appropriate.
        this.state = {
            app: /* do not render anything= */ 'loading',
            authenticated: false,
        };
    }

    // ---------------------------------------------------------------------------------------------
    // Loading routines.
    // ---------------------------------------------------------------------------------------------

    // Initializes the main application state. This is an asynchronous process that may include
    // several network fetches. Generally this is not encouraged.
    async componentWillMount() {
        if (!await this.environment.initialize()) {
            this.setState({ error: 'Unable to initialize the environment.' });
            return;
        }

        // TODO: We need some basic-level routing here for the application(s) that can be accessed,
        // although there is some overlap between them. (For example the main page.)

        this.setState({ app: 'welcome' });
    }

    // ---------------------------------------------------------------------------------------------
    // Display routines.
    // ---------------------------------------------------------------------------------------------

    // Composes the properties that together create for the app context. This enables the full
    // system to access these global application properties.
    composeAppContext(): IAppContext {
        return {
            configuration: this.configuration,
            environment: this.environment,
        }
    }

    // Renders the main app. Provides the context, and then switches between the sub-application
    // that should be presented to the user.
    render() {
        return (
            <AppContext.Provider value={ this.composeAppContext() }>
                { this.state.error && <AppError error={this.state.error} /> }

                { this.state.app === 'loading' && <LoadingApp /> }
                { this.state.app === 'welcome' && <WelcomeApp /> }
            </AppContext.Provider>
        );
    }
}
