// Copyright 2022 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { Component, h } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Input from '@mui/material/Input';
import RefreshIcon from '@mui/icons-material/Refresh';
import SettingsIcon from '@mui/icons-material/Settings';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import { SxProps, Theme } from '@mui/system';
import TextField from '@mui/material/TextField';
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
            accessCode: '1234',
            title: 'Name of location',
        };

        const [ refreshFailedSnackbarOpen, setRefreshFailedSnackbarOpen ] = useState(false);
        const [ refreshSuccessSnackbarOpen, setRefreshSuccessSnackbarOpen ] = useState(false);

        // Called when the refresh button is clicked. Content should be reloaded from the network,
        // after which visual feedback will be issued to the success of the operation.
        function handleRefresh() {
            // TODO: Fetch updated configuration from the network
            // TODO: Display a snackbar to confirm either error or success
        }

        const accessRequestInputRef = useRef();
        const [ accessDeniedSnackbarOpen, setAccessDeniedSnackbarOpen ] = useState(false);
        const [ accessRequestDialogOpen, setAccessRequestDialogOpen ] = useState(false);
        const [ accessRequestError, setAccessRequestError ] = useState(false);
        const [ settingsOpen, setSettingsOpen ] = useState(false);

        // Called when the settings button is clicked. Access to the menu is guarded behind an
        // access code (given through the API) to protect against unintentional access.
        function handleSettings() {
            setAccessRequestError(false);
            setAccessRequestDialogOpen(true);
        }

        // Called when the access request for accessing settings has been cancelled. All dialogs
        // will be closed, and an error message will be shown to the user instead.
        function handleSettingsCancelled() {
            setAccessRequestDialogOpen(false);
            setAccessDeniedSnackbarOpen(true);
        }

        // Called when the access request for accessing settings has been acknowledged and a code
        // has been entered. User feedback will be shown depending on the code's correctness.
        function handleSettingsRequested() {
            if (accessRequestInputRef && accessRequestInputRef.current) {
                const accessRequestInput = accessRequestInputRef.current as HTMLInputElement;
                if (accessRequestInput.value && accessRequestInput.value === display.accessCode) {
                    setAccessRequestDialogOpen(false);
                    setSettingsOpen(true);
                    return;
                }
            }

            setAccessRequestError(true);
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

                { /** Snackbars related to the refresh functionality **/ }

                <Snackbar open={refreshFailedSnackbarOpen} autoHideDuration={4000}
                          onClose={() => setRefreshFailedSnackbarOpen(false)}>
                    <Alert severity="error" variant="filled">
                        Unable to refresh the schedule
                    </Alert>
                </Snackbar>

                <Snackbar open={refreshSuccessSnackbarOpen} autoHideDuration={4000}
                          onClose={() => setRefreshSuccessSnackbarOpen(false)}>
                    <Alert severity="success" variant="filled">
                        The schedule has been refreshed
                    </Alert>
                </Snackbar>

                { /** Dialogs related to the settings functionality  **/ }

                <Dialog open={accessRequestDialogOpen} onClose={handleSettingsCancelled}>
                    <DialogTitle>
                        Volunteer Schedule Display Settings
                    </DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            An access code is required to access the device's settings.
                        </DialogContentText>
                        <TextField autoFocus fullWidth sx={{ mt: 2 }}
                                   error={accessRequestError} label="Access code" type="number"
                                   inputRef={accessRequestInputRef} />
                    </DialogContent>
                    <DialogActions sx={{ pb: 2, pt: 0, pr: 3 }}>
                        <Button onClick={handleSettingsCancelled}>Close</Button>
                        <Button onClick={handleSettingsRequested} variant="contained">Continue</Button>
                    </DialogActions>
                </Dialog>

                <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)}>
                    <DialogContent>
                        <DialogContentText>
                            Settings will go here at some point.
                        </DialogContentText>
                    </DialogContent>
                </Dialog>

                { /** Snackbar related to the settings functionality **/ }

                <Snackbar open={accessDeniedSnackbarOpen} autoHideDuration={4000}
                          onClose={() => setAccessDeniedSnackbarOpen(false)}>
                    <Alert severity="error" variant="filled">
                        Access to the settings has been denied
                    </Alert>
                </Snackbar>

            </Grid>
        );
    }
}
