// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { brown } from '@material-ui/core/colors';
import { createMuiTheme } from '@material-ui/core/styles';

declare module '@material-ui/core/styles/createPalette' {
    interface TypeBackground {
        /**
         * Background colour of the header in <ContentLayout>-based pages.
         */
        contentHeader?: string;
    }
}

export const theme = createMuiTheme({
    palette: {
        background: {
            contentHeader: brown[900],
        }
    }
});
