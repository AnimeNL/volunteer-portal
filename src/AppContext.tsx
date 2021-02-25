// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { createContext } from 'preact';

import { Configuration } from './base/Configuration';
import { Environment } from './base/Environment';

// Interface for the AppContext type. TypeScript's type inference is not being used because we want
// the exported types to be limited versions of the actual implementations.
export interface IAppContext {
    // Provides access to the application's global configuration.
    configuration: Configuration;

    // Provides access to the environment the application is running under.
    environment: Environment;
}

// Export the AppContext context. The default value will be provided by the App component, the code
// here exists to make TypeScript happy without needing possibly-defined types.
export const AppContext = createContext<IAppContext>({} as IAppContext);
