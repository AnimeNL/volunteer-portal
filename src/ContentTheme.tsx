// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { ComponentChildren, h } from 'preact';

import ThemeProvider from '@material-ui/styles/ThemeProvider';
import { createMuiTheme } from '@mui/material/styles';
import { brown } from '@mui/material/colors';

const theme = createMuiTheme({
    palette: {
        primary: { main: brown[700] },
    }
});

// Properties accepted by the <ContentTheme> component.
export interface ContentThemeProps {
    children?: ComponentChildren;
}

// The <ContentTheme> component provides the theme that should be used for all content pages, as has
// been specified in the `theme` variable that is to be found earlier in this file.
export function ContentTheme(props: ContentThemeProps) {
    return <ThemeProvider theme={theme}>{props.children}</ThemeProvider>;
}
