// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { h } from 'preact';

import { chipClasses, default as Chip } from '@mui/material/Chip';
import { styled } from '@mui/material/styles';

import { lighten } from '@mui/material/styles';

export const ContentHeaderChip = styled(Chip)(({ theme }) => {
    const chipBackground = theme.palette.primary.main;

    return {
        [`&.${chipClasses.root}`]: {
            backgroundColor: chipBackground,
            color: 'inherit',
        },
        [`&.${chipClasses.clickable}`]: {
            backgroundColor: chipBackground,
            '&:focus': {
                backgroundColor: lighten(chipBackground, 0.15),
            },
            '&:hover': {
                backgroundColor: lighten(chipBackground, 0.1),
            }
        },
        [`& .${chipClasses.avatarMedium}`]: {
            color: 'inherit !important',
        },
        [`& .${chipClasses.iconMedium}`]: {
            color: 'inherit !important',
        },
    };
});
