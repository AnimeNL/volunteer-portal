// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { Fragment, h } from 'preact';
import { route } from 'preact-router';
import { useMemo, useState } from 'preact/hooks';

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
import { Event, EventLocation, EventSession } from '../../base/Event';
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
     * Unique identifier of the area, through which the URL of the event list can be composed.
     */
    areaIdentifier: string;

    /**
     * The date & time for which the entry is being displayed.
     */
    dateTime: DateTime;

    /**
     * The event for which the entry is being listed.
     */
    event: Event;

    /**
     * Name of the location that's to be shown.
     */
    name: string;

    /**
     * Unique identifier of the location, through which the URL of the event list can be composed.
     */
    identifier: string;

    /**
     * The sessions that should be shown for this entry. No ordering is assumed or cared about by
     * this component, they will be displayed as given.
     */
    sessions: EventSession[];
}

// The <LocationListEntry> component is responsible for displaying the sessions that are active and
// coming up in a particular location, if any. It'll display itself as a card.
function LocationListEntry(props: LocationListEntryProps) {
    const { areaIdentifier, dateTime, event, name, identifier, sessions } = props;

    // The URL in which the full location's programme can be seen. This also happens to be the base
    // URL for any event sessions that take place in this location.
    const url = `/schedule/${event.identifier}/events/${areaIdentifier}/${identifier}/`;

    return (
        <Card>
            <Link href={url} sx={{ color: 'initial', textDecoration: 'initial' }}>
                <CardHeader avatar={<ReadMoreIcon />}
                            sx={kStyles.locationHeader}
                            title={name}
                            titleTypographyProps={{
                                fontWeight: 'normal',
                                noWrap: true,
                                variant: 'h6'
                            }} />
            </Link>
            <Divider />
            <CardContent sx={{ px: 0, '&:last-child': { p: 0 } }}>
                { !sessions.length &&
                    <Alert severity="warning">
                        No further events have been scheduled.
                    </Alert> }

                { sessions.length > 0 &&
                    <List dense disablePadding>
                        { sessions.map(session =>
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

    const [ dateTime, setDateTime ] = useState(DateTime.local());
    // TODO: Subscribe to an effect for propagating event schedule updates.

    // TODO: Make it possible to favourite locations & stick them to the Overview page.

    type LocationInfo = { location: EventLocation, sessions: EventSession[] };

    // Compile a list of all the locations that are part of this area. Memoization is used because
    // we iterate over the values and do a bunch of mutations and ordering changes, which will only
    // change when the |dateTime| is updated, likely triggered by program updates.
    const locations: LocationInfo[] = useMemo(() => {
        const unsortedLocations: LocationInfo[] = [];

        for (const location of area.locations) {
            const active = [];
            const upcoming = [];

            for (const session of location.sessions) {
                if (session.endTime.isBefore(dateTime))
                    continue;  // the |session| is in the past

                if (session.startTime.isBefore(dateTime))
                    active.push(session);
                else if (upcoming.length < kMaximumUpcomingSessions)
                    upcoming.push(session);
            }

            // Sort the |active| sessions based on the time at which they'll finish. The alternative
            // would be to sort them just by name, but it's not clear that's more useful.
            active.sort((lhs, rhs) => {
                if (lhs.endTime.isBefore(rhs.endTime))
                    return -1;
                if (rhs.endTime.isBefore(lhs.endTime))
                    return 1;

                return lhs.name.localeCompare(rhs.name);
            });

            // Limit the number of upcoming sessions to show when there are |active| in this
            // particular location, as future events likely are less informative in that case.
            const slicedUpcomingSessions =
                upcoming.slice(0, Math.max(kMaximumUpcomingSessions - active.length, 0));

             unsortedLocations.push({
                location,
                sessions: [ ...active, ...slicedUpcomingSessions ]
            });
        }

        // Now sort the |unsortedLocations| and return the value. Default sort order is by name,
        // but an exception applies for locations without sessions, which are moved down the list.
        return unsortedLocations.sort((lhs, rhs) => {
            if (lhs.sessions.length && !rhs.sessions.length)
                return -1;
            if (!lhs.sessions.length && rhs.sessions.length)
                return 1;

            return lhs.location.name.localeCompare(rhs.location.name);
        });

    }, [ props.area, dateTime ]);

    return (
        <Fragment>
            <AppTitle title={area.name} />
            <Stack spacing={2} sx={{ pt: 2, pb: 2 }}>
                { !locations.length &&
                    <Alert elevation={1} severity="warning">
                        <AlertTitle>Nothing to see here…</AlertTitle>
                        The locations that are part of <strong>{area.name}</strong> haven't been
                        announced yet—please check again later!
                    </Alert> }

                { locations.length > 0 && locations.map(({ location, sessions }) =>
                    <LocationListEntry areaIdentifier={location.area.identifier}
                                       dateTime={dateTime}
                                       event={event}
                                       name={location.name}
                                       identifier={location.identifier}
                                       sessions={sessions} /> )}
            </Stack>
        </Fragment>
    );
}
