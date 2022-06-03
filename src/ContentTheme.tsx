// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { ComponentChildren, h } from 'preact';
import { useEffect, useState } from 'preact/hooks';

import { PaletteMode } from '@mui/material';
import { Theme, ThemeProvider, createTheme, lighten } from '@mui/material/styles';
import grey from '@mui/material/colors/grey'
import useMediaQuery from '@mui/material/useMediaQuery';

import { Environment } from './base/Environment';

// The possible states that the app's dark mode state can be in.
export type AppThemeState = 'light' | 'auto' | 'dark';

// Interface for the listener that will be invoked whenever the app's dark mode state changes.
type AppThemeListener = (newState: AppThemeState) => void;

// The global listener for application theme state changes. Will exclusively be set by the
// <ContentTheme> component, thus won't be exported from this file.
let applicationThemeListener: AppThemeListener | undefined;

// The global application theme state. Values written to this local are assumed to have been stored
// in local storage, and persist across volunteer portal sessions.
let applicationThemeState: AppThemeState | undefined;

// The global application theme. Will be initialized lazily once the environment configuration is
// available, but will in memory thereafter. Private to this implementation unit.
let applicationTheme: Theme | undefined;

/**
 * Retrieves the current application theme state. Can be updated by calling the similarly named
 * setter. This function does not resolve the "auto" value based on device state.
 */
export function getApplicationThemeState(): AppThemeState {
    return applicationThemeState || 'auto';
}

/**
 * Updates the application theme state to |state|. The state will persist across page loads. State
 * may still be overridden by individual sub-applications part of the volunteer portal.
 */
export function setApplicationThemeState(state: AppThemeState): void {
    applicationThemeState = state;

    // TODO: Persist the setting

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
    const defaultDarkModeState = forceLightMode ? 'light'
                                                : 'light'; // TODO: Fix remaining UI issues, then
                                                           // update this to read "auto"

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
                    palette: {
                        mode: effectiveDarkModeState,

                        background: {
                            default: '#000000',
                            paper: lighten(grey[900], .01),
                        },

                        // TODO: Bring back some colour in Dark Mode to illustrate the environment.
                        //primary: { main: environment.themeColor },
                    }
                });

                break;

            case 'light':
            default:
                applicationTheme = createTheme({
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
