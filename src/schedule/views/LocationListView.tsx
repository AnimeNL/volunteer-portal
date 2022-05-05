// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { Fragment, h } from 'preact';
import { route } from 'preact-router';
import { useState } from 'preact/hooks';

import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ReadMoreIcon from '@mui/icons-material/ReadMore';
import Stack from '@mui/material/Stack';
import { SxProps, Theme } from '@mui/system';

import { AppTitle } from '../../AppTitle';
import { DateTime } from '../../base/DateTime';
import { Event, EventLocation } from '../../base/Event';
import { EventListItem } from '../components/EventListItem';
import { Link } from '../../Link';

// Maximum number of upcoming sessions that will be displayed on the location page.
const kMaximumUpcomingSessions = 3;

// CSS customizations applied to the <LocationListView> and <LocationListEntry> components.
const kStyles: { [key: string]: SxProps<Theme> } = {
    locationHeader: {
        py: 1,

        '& .MuiCardHeader-content': {
            minWidth: 0,
        },
    },
};

// Properties available for the <LocationListEntry> component.
interface LocationListEntryProps {
    /**
     * The date & time for which the entry is being displayed.
     */
    dateTime: DateTime;

    /**
     * The event for which the entry is being listed.
     */
    event: Event;

    /**
     * The location for which the entry is being displayed.
     */
    location: EventLocation;
}

// The <LocationListEntry> component is responsible for displaying the sessions that are active and
// coming up in a particular location, if any. It'll display itself as a card.
function LocationListEntry(props: LocationListEntryProps) {
    const { dateTime, event, location } = props;
    const { area } = location;

    // TODO: Make it possible to favourite locations & stick them to the Overview page.
    // TODO: Active sessions should be sorted in a way that it's easy to consume the information.

    // The URL in which the full location's programme can be seen. This also happens to be the base
    // URL for any event sessions that take place in this location.
    const url = `/schedule/${event.identifier}/events/${area.identifier}/${location.identifier}/`;

    // Identify the events which are active in this location right now (they're always displayed),
    // and the 3 upcoming events, which will be displayed when there's space.
    const activeSessions = [];
    const upcomingSessions = [];

    for (const session of location.sessions) {
        if (session.endTime.isBefore(dateTime))
            continue;  // the |session| is in the past

        if (session.startTime.isBefore(dateTime))
            activeSessions.push(session);
        else if (upcomingSessions.length < kMaximumUpcomingSessions)
            upcomingSessions.push(session);
    }

    // Limit the number of upcoming sessions that will be shown when there are |activeSessions| in
    // this particular location, as future events likely are less informative in that case.
    const slicedUpcomingSessions =
        upcomingSessions.slice(0, Math.max(kMaximumUpcomingSessions - activeSessions.length, 0));

    return (
        <Card>
            <Link href={url} sx={{ color: 'initial', textDecoration: 'initial' }}>
                <CardHeader avatar={<ReadMoreIcon />}
                            sx={kStyles.locationHeader}
                            title={location.name}
                            titleTypographyProps={{
                                fontWeight: 'normal',
                                noWrap: true,
                                variant: 'h6'
                            }} />
            </Link>
            <Divider />
            <CardContent sx={{ px: 0, '&:last-child': { p: 0 } }}>
                { !activeSessions.length && !upcomingSessions.length &&
                    <Alert severity="warning">
                        No further events have been scheduled.
                    </Alert> }

                { (activeSessions.length > 0 || upcomingSessions.length > 0) &&
                    <List dense disablePadding>
                        { [ ...activeSessions, ...slicedUpcomingSessions].map(session =>
                            <EventListItem dateTime={dateTime}
                                           event={event}
                                           session={session}
                                           timeDisplay="relative" /> )}
                    </List> }

            </CardContent>
        </Card>
    );
}

// Properties available for the <LocationListView> component.
export interface LocationListViewProps {
    /**
     * The event for which the locations are being listed.
     */
    event: Event;

    /**
     * Unique identifier indicating the area for which we want to see locations. This could be a
     * floor, an area within (or near) the event venue, or any other grouping.
     */
    area: string;
};

// The <LocationListView> component is responsible for displaying the locations within a particular
// area of the convention, including the active and common events that will take place in them.
export function LocationListView(props: LocationListViewProps) {
    const { event } = props;

    const area = event.area(props.area);
    if (!area) {
        route(`/schedule/${event.identifier}/events/`);
        return <></>;
    }

    // TODO: Sort idle locations to the bottom of the list?

    const [ dateTime, setDateTime ] = useState(DateTime.local());
    // TODO: Subscribe to an effect for propagating event schedule updates.

    return (
        <Fragment>
            <AppTitle title={area.name} />
            <Stack spacing={2} sx={{ pt: 2, pb: 2 }}>
                { !area.locations.length &&
                    <Alert elevation={1} severity="warning">
                        <AlertTitle>Nothing to see here…</AlertTitle>
                        The locations that are part of <strong>{area.name}</strong> haven't been
                        announced yet—please check again later!
                    </Alert> }

                { area.locations.length && area.locations.map(location =>
                    <LocationListEntry dateTime={dateTime} event={event} location={location} /> )}
            </Stack>
        </Fragment>
    );
}
