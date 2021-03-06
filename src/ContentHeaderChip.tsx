// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { h } from 'preact';

import Chip from '@material-ui/core/Chip';
import { lighten, withStyles } from '@material-ui/core/styles';

export const ContentHeaderChip = withStyles(theme => {
    const chipBackground = theme.palette.primary.main;

    return {
        root: {
            backgroundColor: chipBackground,
            color: theme.palette.getContrastText(chipBackground),
        },
        clickable: {
            backgroundColor: chipBackground,
            '&:focus': {
                backgroundColor: lighten(chipBackground, 0.15),
            },
            '&:hover': {
                backgroundColor: lighten(chipBackground, 0.1),
            }
        },
        icon: {
            color: 'inherit !important',
        },
    };

})(Chip);
