// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { Fragment, h } from 'preact';
import { route } from 'preact-router';

import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Divider from '@mui/material/Divider';
import ReadMoreIcon from '@mui/icons-material/ReadMore';
import Stack from '@mui/material/Stack';
import { SxProps, Theme } from '@mui/system';

import { AppTitle } from '../../AppTitle';
import { Event, EventLocation } from '../../base/Event';
import { Link } from '../../Link';

// CSS customizations applied to the <LocationListView> and <LocationListEntry> components.
const kStyles: { [key: string]: SxProps<Theme> } = {
    locationHeader: {
        //color: 'text.primary',

        '& .MuiCardHeader-content': {
            minWidth: 0,
        },
    },
};

// Properties available for the <LocationListEntry> component.
interface LocationListEntryProps {
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
    const { event, location } = props;
    const { area } = location;

    // TODO: Make it possible to favourite locations & stick them to the Overview page.
    // TODO: Display hidden events part of this location.

    // The URL in which the full location's programme can be seen. This also happens to be the base
    // URL for any event sessions that take place in this location.
    const url = `/schedule/${event.identifier}/events/${area.identifier}/${location.identifier}/`;

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
            <CardContent>
                Yo
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

    return (
        <Fragment>
            <AppTitle title={area.name} />
            <Stack spacing={2} sx={{ pt: 2 }}>
                { !area.locations.length &&
                    <Alert elevation={1} severity="warning">
                        <AlertTitle>Nothing to see here…</AlertTitle>
                        The locations that are part of <strong>{area.name}</strong> haven't been
                        announced yet—please check again later!
                    </Alert> }

                { area.locations.length && area.locations.map(location =>
                    <LocationListEntry event={event} location={location} /> )}
            </Stack>
        </Fragment>
    );
}
