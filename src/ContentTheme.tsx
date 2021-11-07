// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { ComponentChildren, h } from 'preact';

import { PaletteMode } from '@mui/material';
import { Theme, ThemeProvider, createTheme } from '@mui/material/styles';

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

// Converts the given |setting| to a configured PaletteMode to be used in the content's theme.
function toPaletteMode(setting: any): PaletteMode {
    return !!setting ? 'dark' : 'light';
}

// The <ContentTheme> component provides the theme that should be used for all content pages, as has
// been specified in the `theme` variable that is to be found earlier in this file.
export function ContentTheme(props: ContentThemeProps) {
    if (!applicationTheme || applicationTheme.palette.mode != toPaletteMode(props.darkMode)) {
        const { environment } = props;

        applicationTheme = createTheme({
            palette: {
                primary: { main: environment.themeColor },
                mode: toPaletteMode(props.darkMode),
            }
        });
    }

    return <ThemeProvider theme={applicationTheme}>{props.children}</ThemeProvider>;
}
