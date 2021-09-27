// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { ComponentChildren, h } from 'preact';

import { Theme, ThemeProvider, createTheme } from '@mui/material/styles';

import { Environment } from './base/Environment';

// The global application theme state. Will be initialized lazily once the environment configuration
// is available, but will in memory thereafter. Private to this implementation unit.
let applicationTheme: Theme | undefined;

// Properties accepted by the <ContentTheme> component.
export interface ContentThemeProps {
    children?: ComponentChildren;
    environment: Environment;
}

// The <ContentTheme> component provides the theme that should be used for all content pages, as has
// been specified in the `theme` variable that is to be found earlier in this file.
export function ContentTheme(props: ContentThemeProps) {
    if (!applicationTheme) {
        const { environment } = props;

        applicationTheme = createTheme({
            palette: {
                primary: { main: environment.themeColor },
            }
        });
    }

    return <ThemeProvider theme={applicationTheme}>{props.children}</ThemeProvider>;
}
