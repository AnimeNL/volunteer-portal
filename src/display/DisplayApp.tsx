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
import LinearProgress from '@mui/material/LinearProgress';
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

import type { IDisplayResponse } from '../api/IDisplay';

import { ApiRequestManager, ApiRequestObserver } from '../base/ApiRequestManager';
import { DateTime } from '../base/DateTime';
import { Timer } from '../base/Timer';
import { initials } from '../base/NameUtilities';

// Interval, in milliseconds, between which we should request timeline updates from the network.
const kRefreshTimerIntervalMs = 15 /* =minutes */ * 60 * 1000;

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
        backgroundColor: '#1A237E',
        color: '#ffffff',
        px: 2,
        py: 1,
    },
    scroller: {
        overflowY: 'scroll',
        flexGrow: 1,
    },
    timelineDot: {
        padding: 0,
        borderWidth: 0,
        margin: '6px 0',
    },
};

// TODO: This should become part of the API.
interface TimelineEntry {
    // URL to the avatar of the volunteer for this shift, if any.
    avatar?: string;

    // Name of the volunteer that will be active during this shift.
    name: string;

    // Role of the volunteer for this shift, i.e. what will they be doing?
    role: string;

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
                        <TimelineDot sx={kStyles.timelineDot}>
                            <Avatar src={item.avatar}>
                                {initials(item.name)}
                            </Avatar>
                        </TimelineDot>
                        <TimelineConnector />
                    </TimelineSeparator>
                    <TimelineContent sx={{ m: 'auto 0' }}>
                        <Typography variant="subtitle1" component="span">
                            <strong>{item.name}</strong> ({item.role})
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
    // Whether the application is currently fetching content.
    loading: boolean;

    // State of the refresh mechanism, which can be called by the device's host.
    refreshState: 'unknown' | 'error' | 'success';

    // The title for this particular display, shared by the server.
    title: string;

    // The timeline as it should be displayed on the display.
    timeline: TimelineEntry[];
}

// The Display App powers the dedicated 7" displays we issue to various locations during the
// festival, enabling them to understand which volunteers (if any) are scheduled to appear at which
// times. While it shares an environment, most configuration is provided by the server.
export class DisplayApp extends Component<DisplayAppProps, DisplayAppState>
                        implements ApiRequestObserver<'IDisplay'> {

    // The request manager is responsible for fetching information from the API.
    #requestManager: ApiRequestManager<'IDisplay'>;

    // Timer responsible for refreshing the event information from the network.
    #refreshEventTimer: Timer;

    state: DisplayAppState = {
        loading: false,
        refreshState: 'unknown',

        title: 'Unknown Display (AnimeCon)',
        timeline: [],
    };

    constructor() {
        super();

        this.#requestManager = new ApiRequestManager('IDisplay', this);
        this.#refreshEventTimer = new Timer(this.requestRefresh);
    }

    // Called when the <DisplayApp /> component has been mounted. Initializes the data request.
    componentDidMount() {
        this.refresh();
    }

    // ---------------------------------------------------------------------------------------------

    // Refreshes the information from the network. This will issue a network request to the API for
    // the display as it has been configured.
    async refresh() {
        this.setState({ loading: true });

        const parameters = new URLSearchParams(document.location.search);
        const display = parameters.get('display');

        if (display)
            await this.#requestManager.issue({ identifier: display });
        else
            this.setState({ refreshState: 'error' });

        this.#refreshEventTimer.start(kRefreshTimerIntervalMs);
        this.setState({ loading: false });
    }

    // Request a refresh of the schedule. Safe to call multiple times, whereas calls will be ignored
    // if a refresh is already in progress. (To not hammer the server.)
    requestRefresh = () => {
        if (!this.state.loading)
            this.refresh();
    };

    // Resets the refresh state for the application, which will hide any snackbars that are being
    // shown to the user.
    resetRefreshState = () => {
        this.setState({ refreshState: 'unknown' });
    };

    // ---------------------------------------------------------------------------------------------
    // ApiRequestObserver interface
    // ---------------------------------------------------------------------------------------------

    onFailedResponse(error: Error): void {
        this.setState({ refreshState: 'error' });
    }

    onSuccessResponse(response: IDisplayResponse): void {
        if (response.error) {
            console.error(response.error);
            this.setState({ refreshState: 'error' });

        } else {
            const title = response.title || 'AnimeCon Volunteering Team';
            const timeline: TimelineEntry[] = [];

            for (const shift of response.shifts!) {
                timeline.push({
                    avatar: shift.avatar,
                    name: shift.name,
                    role: shift.role,

                    startTime: DateTime.fromUnix(shift.time[0]),
                    endTime: DateTime.fromUnix(shift.time[1]),
                });
            }

            this.setState({ refreshState: 'success', title, timeline });
        }
    }

    // ---------------------------------------------------------------------------------------------

    render() {
        const { loading, refreshState, timeline, title } = this.state;

        // TODO: Scroll down to the first active shifts, when the convention is in progress.

        return (
            <Grid container alignItems="center" justifyContent="center" sx={kStyles.root}>
                <Stack alignItems="stretch" justifyContent="flex-start" sx={kStyles.container}>
                    <Stack direction="row" alignItems="center" sx={kStyles.navigation}>

                        <Typography variant="button" component="h1" sx={{ flexGrow: 1 }}>
                            {title}
                        </Typography>

                        <Typography variant="button" component="p" sx={{ pr: 1 }}>
                            <CurrentTimeDisplay />
                        </Typography>

                        <IconButton onClick={this.requestRefresh} color="inherit">
                            <RefreshIcon />
                        </IconButton>

                    </Stack>

                    { loading && <LinearProgress color="primary" /> }

                    <Stack justifyContent="flex-start" alignItems="center" sx={kStyles.scroller}>

                        { !timeline.length &&
                            <>
                                <EventBusyIcon color="primary" sx={{ mt: 20 }} />
                                <Typography variant="subtitle2" sx={{ pt: 2 }}>
                                    No volunteers have been scheduled
                                </Typography>
                            </> }

                        { timeline.length > 0 &&
                            <DisplayTimeline timeline={timeline} /> }

                    </Stack>
                </Stack>

                { /** Snackbars related to the refresh functionality **/ }

                <Snackbar open={refreshState === 'error'} autoHideDuration={4000}
                          onClose={this.resetRefreshState}>
                    <Alert severity="error" variant="filled">
                        Unable to refresh the schedule
                    </Alert>
                </Snackbar>

                <Snackbar open={refreshState === 'success'} autoHideDuration={4000}
                          onClose={this.resetRefreshState}>
                    <Alert severity="success" variant="filled">
                        The schedule has been updated
                    </Alert>
                </Snackbar>

            </Grid>
        );
    }
}
