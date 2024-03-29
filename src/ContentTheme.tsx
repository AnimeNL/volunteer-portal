// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { ComponentChildren, h } from 'preact';
import { useEffect, useState } from 'preact/hooks';

import { PaletteMode } from '@mui/material';
import { Theme, ThemeProvider, createTheme, darken, lighten } from '@mui/material/styles';
import grey from '@mui/material/colors/grey'
import useMediaQuery from '@mui/material/useMediaQuery';

import { Environment } from './base/Environment';

// The possible states that the app's dark mode state can be in.
export type AppThemeState = 'light' | 'auto' | 'dark';

// Default dark mode state that should apply to users who have not overridden the setting.
const kDefaultDarkModeState = 'auto';

// Interface for the listener that will be invoked whenever the app's dark mode state changes.
type AppThemeListener = (newState: AppThemeState) => void;

// The global listener for application theme state changes. Will exclusively be set by the
// <ContentTheme> component, thus won't be exported from this file.
let applicationThemeListener: AppThemeListener | undefined;

// The global application theme state. Values written to this local are assumed to have been stored
// in local storage, and persist across volunteer portal sessions.
let applicationThemeState: AppThemeState = (function() {
    try {
        const storedValue = localStorage.getItem('vp-theme-state');
        switch (storedValue) {
            case 'auto':
            case 'dark':
            case 'light':
                return storedValue;
        }
    } catch (exception) {
        console.info('FYI: Unable to read the cached theme state.', exception);
    }

    return kDefaultDarkModeState;
})();

// The global application theme. Will be initialized lazily once the environment configuration is
// available, but will in memory thereafter. Private to this implementation unit.
let applicationTheme: Theme | undefined;

/**
 * Retrieves the current application theme state. Can be updated by calling the similarly named
 * setter. This function does not resolve the "auto" value based on device state.
 */
export function getApplicationThemeState(): AppThemeState {
    return applicationThemeState;
}

/**
 * Updates the application theme state to |state|. The state will persist across page loads. State
 * may still be overridden by individual sub-applications part of the volunteer portal.
 */
export function setApplicationThemeState(state: AppThemeState): void {
    applicationThemeState = state;

    try {
        localStorage.setItem('vp-theme-state', state);
    } catch (exception) {
        console.info('FYI: Unable to write the cached theme state.', exception);
    }

    if (applicationThemeListener)
        applicationThemeListener(state);
}

// Properties accepted by the <ContentTheme> component.
export interface ContentThemeProps {
    children?: ComponentChildren;
    environment: Environment;
    forceLightMode?: boolean;
}

// The <ContentTheme> component provides the theme that should be used for all content pages, as has
// been specified in the `theme` variable that is to be found earlier in this file.
export function ContentTheme(props: ContentThemeProps) {
    const { children, environment, forceLightMode } = props;

    // The default dark mode state will depend on whether light mode has been forced. Otherwise we
    // follow the system's default setting, which might even impose different colors during the day.
    const defaultDarkModeState = forceLightMode ? 'light' : applicationThemeState;

    // Maintain the intended dark mode state of the application, and attach an observer to the
    // configuration functions that may be invoked from application UI (e.g. the menu).
    const [ darkModeState, setDarkModeState ] = useState<AppThemeState>(defaultDarkModeState);
    useEffect(() => {
        if (forceLightMode)
            return;  // nothing to do, always force the state to light

        applicationThemeListener = setDarkModeState;
        return () => applicationThemeListener = undefined;

    }, [ forceLightMode ]);

    // If |darkModeState| is set to `auto`, we need to resolve the actual state to preferences of
    // the operating system. This is done by observing a media query.
    const systemPrefersDarkColorScheme = useMediaQuery('(prefers-color-scheme: dark)');
    const effectiveDarkModeState: PaletteMode =
        darkModeState === 'auto' ? (systemPrefersDarkColorScheme ? 'dark' : 'light')
                                 : darkModeState;

    // The application theme is cached to prevent us from creating it multiple times. However, when
    // the effective dark mode state changes, it has to be recreated.
    if (!applicationTheme || applicationTheme.palette.mode != effectiveDarkModeState) {
        switch (effectiveDarkModeState) {
            case 'dark':
                applicationTheme = createTheme({
                    breakpoints: {
                        values: {
                            xs: 0,
                            sm: 600,
                            md: 840,
                            lg: 1200,
                            xl: 1536,
                        },
                    },
                    components: {
                        MuiAppBar: {
                            styleOverrides: {
                                root: {
                                    backgroundColor: darken(environment.themeColor, .35),
                                },
                            },
                        },
                    },
                    palette: {
                        mode: effectiveDarkModeState,

                        primary: {
                            main: environment.themeColorDarkMode
                                      ? environment.themeColorDarkMode
                                      : lighten(environment.themeColor, .7)
                        },

                        background: {
                            default: '#000000',
                            paper: lighten(grey[900], .01),
                        },
                    }
                });

                break;

            case 'light':
            default:
                applicationTheme = createTheme({
                    breakpoints: {
                        values: {
                            xs: 0,
                            sm: 600,
                            md: 840,
                            lg: 1200,
                            xl: 1536,
                        },
                    },
                    palette: {
                        primary: { main: environment.themeColor },
                        mode: effectiveDarkModeState,
                    }
                });

                break;
        }
    }

    return <ThemeProvider theme={applicationTheme}>{children}</ThemeProvider>;
}
