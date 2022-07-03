// Copyright 2022 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { Component, h } from 'preact';
import { useEffect, useState } from 'preact/hooks';

import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import RefreshIcon from '@mui/icons-material/Refresh';
import SettingsIcon from '@mui/icons-material/Settings';
import Stack from '@mui/material/Stack';
import { SxProps, Theme } from '@mui/system';
import Typography from '@mui/material/Typography';

import { DateTime } from '../base/DateTime';

// Customized styling for the <WelcomeApp> component.
const kStyles: { [key: string]: SxProps<Theme> } = {
    root: {
        backgroundColor: '#607d8b',  // blueGrey[500]
        height: '100vh',
    },
    container: {
        backgroundColor: '#f3f7ec',
        width: '800px',
        height: '480px',
    },
    navigation: {
        backgroundColor: '#dae8cd',
        px: 2,
        py: 1,
    },
};

// Component that displays the current time of the application, in a manner that maintains a timer
// to keep it actual for the lifetime of the component.
function CurrentTimeDisplay() {
    const [ dateTime, setDateTime ] = useState<DateTime>(DateTime.local());

    useEffect(() => {
        const updateTimer = () => setDateTime(DateTime.local());

        const intervalId = setInterval(updateTimer, 5000);
        return () => clearInterval(intervalId);
    });

    return <>{dateTime.format('dayTime')}</>;
}

// Properties accepted by the <DisplayApp> component.
interface DisplayAppProps {
    // Identifier of the display that should be shown, if any. Optional, the identifier will be
    // asked for on first load as well, which is a more intuitive user interface.
    identifier?: string;
}

// State maintained by the <DisplayApp> component. Each state update invalidates the layout.
interface DisplayAppState {

}

// The Display App powers the dedicated 7" displays we issue to various locations during the
// festival, enabling them to understand which volunteers (if any) are scheduled to appear at which
// times. While it shares an environment, most configuration is provided by the server.
export class DisplayApp extends Component<DisplayAppProps, DisplayAppState> {
    render() {
        // TODO: Display identifier selection
        // TODO: Fetch display configuration from the API
        // TODO: Settings menu (behind a passcode)

        const display = {
            accessCode: 1234,
            title: 'Name of location',
        };

        // Called when the refresh button is clicked. Content should be reloaded from the network,
        // after which visual feedback will be issued to the success of the operation.
        function handleRefresh() {
            // TODO: Fetch updated configuration from the network
            // TODO: Display a snackbar to confirm either error or success
        }

        // Called when the settings button is clicked. Access to the menu is guarded behind an
        // access code (given through the API) to protect against unintentional access.
        function handleSettings() {
            // TODO: Confirm access by asking for the access code
            // TODO: Cache the access code for a certain amount of time?
            // TODO: Display a modal menu once the access code has been confirmed
            // TODO: Display a snackbar error in case the access code got rejected
        }

        return (
            <Grid container alignItems="center" justifyContent="center" sx={kStyles.root}>
                <Stack alignItems="stretch" justifyContent="flex-start" sx={kStyles.container}>
                    <Stack direction="row" alignItems="center" sx={kStyles.navigation}>

                        <Typography variant="button" component="h1" sx={{ flexGrow: 1 }}>
                            {display.title}
                        </Typography>

                        <Typography variant="button" component="p" sx={{ pr: 1 }}>
                            <CurrentTimeDisplay />
                        </Typography>

                        <IconButton onClick={handleRefresh} >
                            <RefreshIcon />
                        </IconButton>

                        <IconButton onClick={handleSettings}>
                            <SettingsIcon />
                        </IconButton>

                    </Stack>

                    <p>
                        Content
                    </p>

                </Stack>
            </Grid>
        );
    }
}
