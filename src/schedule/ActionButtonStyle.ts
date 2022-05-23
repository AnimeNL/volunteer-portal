// Copyright 2022 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { SxProps, Theme, darken, lighten } from '@mui/system';

// Various views include action buttons for in-line controls and functionality access, the styles
// for which should be shared among these views and components. This styling is dark mode aware, and
// is appropriate both for desktop and mobile displays.
export const kActionButtonStyle: SxProps<Theme> = theme => {
    return theme.palette.mode === 'light' ?
        {
            // light mode:
            backgroundColor: lighten(theme.palette.primary.main, .96),
            marginLeft: 2,

            '&:hover': {
                '@media (hover: none)': {
                    backgroundColor: lighten(theme.palette.primary.main, .96),
                },
            }
        } :
        {
            // dark mode:
            backgroundColor: theme.palette.grey[600],
            color: 'black',
            marginLeft: 2,

            '&:hover, &:active': {
                backgroundColor: theme.palette.grey[500],
            }
        };
};
