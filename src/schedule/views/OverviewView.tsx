// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { Fragment, h } from 'preact';
import { useContext, useState } from 'preact/compat';

import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';

import { AppContext } from '../../AppContext';
import { AppTitle } from '../../AppTitle';
import { DateTime } from '../../base/DateTime';
import { Event, EventVolunteer } from '../../base/Event';

// Properties made available to the <EventStatusDisplay> component.
interface EventStatusDisplayProps {
    /**
     * Event for which the <EventStatusDisplay> component is being displayed.
     */
    event: Event;
}

// Displays a card indicating whether the event has started yet, or when it will, or when it has
// closed in case the event happened in the past. (Which would be sad.)
//
// The <EventStatusDisplay> does not share the DateTime instance with the parent components, as is
// more common, as the component will end up refreshing itself every second during certain times.
function EventStatusDisplay(props: EventStatusDisplayProps) {
    const { event } = props;

    const [ dateTime, setDateTime ] = useState(DateTime.local());
    // TODO: Schedule updates based on the distance between |dateTime| and either the |event|'s
    // start of end time, depending on which is being displayed.

    if (dateTime.isBefore(event.startTime)) {
        return (
            <Alert elevation={2} sx={{ marginTop: { lg: 2 } }} severity="info">
                <strong>{event.name}</strong> will officially start {dateTime.moment().to(event.startTime.moment())}.
            </Alert>
        );
    } else if (dateTime.isBefore(event.endTime)) {
        return (
            <Alert elevation={2} sx={{ marginTop: { lg: 2 } }} severity="success">
                <strong>{event.name}</strong> is currently happening!
            </Alert>
        );
    } else {
        return (
            <Alert elevation={2} sx={{ marginTop: { lg: 2 } }} severity="info">
                <strong>{event.name}</strong> finished {event.endTime.moment().from(dateTime.moment())}.
            </Alert>
        );
    }
}

// Properties made available to the <VolunteerShiftOverview> component.
interface VolunteerShiftOverview {
    /**
     * The DateTime instance for when the information should be shown.
     */
    dateTime: DateTime;

    /**
     * The volunteer for whom the upcoming shift information should be displayed.
     */
    volunteer: EventVolunteer;
}

// The <VolunteerShiftOverview> component displays information about the volunteer's current and
// upcoming shifts during the event. This is only available when the volunteer has shifts.
function VolunteerShiftOverview(props: VolunteerShiftOverview) {
    // TODO: Implement the shift overview tiles
    return <></>;
}

// Properties made available to the <OverviewViewProps> component.
interface OverviewViewProps {
    /**
     * The event for which the overview page is being displayed.
     */
    event: Event;
}

// Displays the volunteer portal's overview page, which shows the volunteer basic information about
// the event, information about their shifts, and displays the events they've flagged. It's possible
// for people to be able to open this page without being a volunteer themselves.
export function OverviewView(props: OverviewViewProps) {
    const { event } = props;
    const { user } = useContext(AppContext);

    const volunteer = event.volunteer({ name: user.name });

    const [ dateTime, setDateTime ] = useState(DateTime.local());
    // TODO: Subscribe to an effect for propagating event schedule updates.

    return (
        <Fragment>
            <AppTitle />

            <EventStatusDisplay event={event} />

            { (volunteer && volunteer.shifts.length > 0) &&
                <VolunteerShiftOverview dateTime={dateTime}
                                        volunteer={volunteer} /> }

            { (!volunteer || !volunteer.shifts.length) &&
                <Alert severity="error" elevation={2} sx={{ marginTop: { lg: 2 } }}>
                    <AlertTitle>Shifts are unavailable</AlertTitle>
                    Not all of the volunteer portal's functionality will be available because no
                    shifts have been scheduled for <strong>{user.name}</strong>. Are you even real?
                </Alert> }

            { /* flagged events */ }

        </Fragment>
    );
}
