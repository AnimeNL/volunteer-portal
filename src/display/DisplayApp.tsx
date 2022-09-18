// Copyright 2022 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { Component, h } from 'preact';
import { useEffect, useState } from 'preact/hooks';

import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import RefreshIcon from '@mui/icons-material/Refresh';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import { SxProps, Theme } from '@mui/system';
import Timeline from '@mui/lab/Timeline';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineOppositeContent from '@mui/lab/TimelineOppositeContent';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import Typography from '@mui/material/Typography';

import { DateTime } from '../base/DateTime';
import { initials } from '../base/NameUtilities';

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
        backgroundColor: '#a33e00',
        color: '#ffffff',
        px: 2,
        py: 1,
    },
    scroller: {
        overflowY: 'scroll',
        flexGrow: 1,
    },
};

// TODO: This should become part of the API.
interface TimelineEntry {
    // URL to the avatar of the volunteer for this shift, if any.
    avatar?: string;

    // Name of the volunteer that will be active during this shift.
    name: string;

    // Start time of the shift, as a DateTime object.
    startTime: DateTime;

    // End time of the shift, as a DateTime object.
    endTime: DateTime;
}

// Properties made available to the <DisplayTimeline> component.
interface DisplayTimelineProps {
    timeline: TimelineEntry[];
}

// Component that displays a timeline based on the given |props|. The Material UI timeline component
// is used. Performance may suffer for areas in which there are a lot of pending shifts.
function DisplayTimeline(props: DisplayTimelineProps) {
    return (
        <Timeline sx={{ width: '100%' }}>
            { props.timeline.map(item =>
                <TimelineItem>
                    <TimelineOppositeContent sx={{ m: 'auto 0' }} color="text.secondary">
                        {item.startTime.format('dayTime')}–{item.endTime.format('time')}
                    </TimelineOppositeContent>
                    <TimelineSeparator>
                        <TimelineConnector />
                        <TimelineDot>
                            <Avatar src={item.avatar} sx={{ width: 24, height: 24 }}>
                                {initials(item.name)}
                            </Avatar>
                        </TimelineDot>
                        <TimelineConnector />
                    </TimelineSeparator>
                    <TimelineContent sx={{ m: 'auto 0' }}>
                        <Typography variant="h6" component="span">
                            {item.name}
                        </Typography>
                    </TimelineContent>
                </TimelineItem> )}
        </Timeline>
    );
}

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
            timeline: [
                {
                    name: 'Volunteer A',
                    startTime: DateTime.fromUnix(1657364400),
                    endTime: DateTime.fromUnix(1657371600),
                },
                {
                    name: 'Volunteer B',
                    startTime: DateTime.fromUnix(1657369800),
                    endTime: DateTime.fromUnix(1657375200),
                }
            ],
            title: 'Name of location',
        };

        const [ refreshFailedSnackbarOpen, setRefreshFailedSnackbarOpen ] = useState(false);
        const [ refreshSuccessSnackbarOpen, setRefreshSuccessSnackbarOpen ] = useState(false);

        // Called when the refresh button is clicked. Content should be reloaded from the network,
        // after which visual feedback will be issued to the success of the operation.
        function handleRefresh() {
            // TODO: Fetch updated configuration from the network
            // TODO: Display a snackbar to confirm either error or success
            setRefreshFailedSnackbarOpen(true);
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

                        <IconButton onClick={handleRefresh} color="inherit">
                            <RefreshIcon />
                        </IconButton>

                    </Stack>
                    <Stack justifyContent="flex-start" alignItems="center" sx={kStyles.scroller}>
                        { display.timeline.length > 0 &&
                            <DisplayTimeline timeline={display.timeline} /> }

                        { !display.timeline.length &&
                            <>
                                <EventBusyIcon htmlColor="#396a1e" sx={{ mt: 20 }} />
                                <Typography variant="subtitle2" sx={{ pt: 2 }}>
                                    No volunteers have been scheduled
                                </Typography>
                            </> }
                    </Stack>
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

            </Grid>
        );
    }
}
