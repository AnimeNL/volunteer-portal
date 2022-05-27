// Copyright 2022 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { h } from 'preact';
import { route } from 'preact-router';

import Box from '@mui/material/Box';
import CardActionArea from '@mui/material/CardActionArea';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';

// Properties made available to the <OverviewCard> component.
interface OverviewCardProps {
    /**
     * Children that should be drawn on the overview card.
     */
    children: React.ReactNode;

    /**
     * URL that should be navigated to when the card gets activated, if any.
     */
    href?: string;

    /**
     * The icon that should be drawn on the card.
     */
    icon: React.ReactNode;
}

// The <OverviewCard> component is the base of a card that can be shown on the <OverviewView>, which
// is a regular Material card that leads with an icon to indicate its purpose.
export function OverviewCard(props: OverviewCardProps) {
    const { children, href, icon } = props;

    if (href) {
        return (
            <Paper sx={{ mt: 2 }}>
                <CardActionArea sx={{ p: 2 }} onClick={ _ => route(href) }>
                    <Stack direction="row" spacing={2}
                        divider={ <Divider orientation="vertical" flexItem /> }>

                        {icon}

                        <Box>
                            {children}
                        </Box>

                    </Stack>
                </CardActionArea>
            </Paper>
        );
    } else {
        return (
            <Paper sx={{ mt: 2, p: 2 }}>
                <Stack direction="row" spacing={2}
                    divider={ <Divider orientation="vertical" flexItem /> }>

                    {icon}

                    <Box>
                        {children}
                    </Box>

                </Stack>
            </Paper>
        );
    }
}
