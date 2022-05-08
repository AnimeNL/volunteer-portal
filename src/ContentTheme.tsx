// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { ComponentChildren, h } from 'preact';

import { PaletteMode } from '@mui/material';
import { Theme, ThemeProvider, createTheme, lighten } from '@mui/material/styles';
import grey from '@mui/material/colors/grey'

import { Environment } from './base/Environment';

// The global application theme state. Will be initialized lazily once the environment configuration
// is available, but will in memory thereafter. Private to this implementation unit.
let applicationTheme: Theme | undefined;

// Properties accepted by the <ContentTheme> component.
export interface ContentThemeProps {
    children?: ComponentChildren;
    darkMode?: boolean;
    environment: Environment;
}

// The <ContentTheme> component provides the theme that should be used for all content pages, as has
// been specified in the `theme` variable that is to be found earlier in this file.
export function ContentTheme(props: ContentThemeProps) {
    const paletteMode: PaletteMode = props.darkMode ? 'dark' : 'light';

    if (!applicationTheme || applicationTheme.palette.mode != paletteMode) {
        const { environment } = props;

        switch (paletteMode) {
            case 'dark':
                applicationTheme = createTheme({
                    palette: {
                        mode: paletteMode,

                        background: {
                            default: '#000000',
                            paper: lighten(grey[900], .01),
                        },

                        //primary: { main: environment.themeColor },
                    }
                });

                break;

            case 'light':
            default:
                applicationTheme = createTheme({
                    palette: {
                        primary: { main: environment.themeColor },
                        mode: paletteMode,
                    }
                });

                break;
        }
    }

    return <ThemeProvider theme={applicationTheme}>{props.children}</ThemeProvider>;
}
