// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { Fragment, h } from 'preact';
import { useContext } from 'preact/compat';

import AlertTitle from '@mui/material/AlertTitle';
import AssignmentIcon from '@mui/icons-material/Assignment';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import Typography from '@mui/material/Typography';

import { AppContext } from '../../AppContext';
import { AppTitle } from '../../AppTitle';
import { DarkModeCapableAlert } from '../components/DarkModeCapableAlert';
import { DateTime } from '../../base/DateTime';
import { EducationCard } from '../components/EducationCard';
import { EventTracker } from '../../base/EventTracker';
import { Event, EventShift, EventVolunteer } from '../../base/Event';
import { NardoAdvice } from '../components/NardoAdvice';
import { OverviewCard } from '../components/OverviewCard';
import { TimeTicker } from '../components/TimeTicker';

// Properties made available to the <EventStatusDisplay> component.
interface EventStatusDisplayProps {
    /**
     * Date & time at which the event status card is being displayed.
     */
    dateTime: DateTime;

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
    const { dateTime, event } = props;

    if (dateTime.isBefore(event.startTime)) {
        return (
            <DarkModeCapableAlert elevation={1} sx={{ marginTop: { lg: 2 } }} severity="info">
                <strong>{event.name}</strong> will officially
                start <TimeTicker dateTime={dateTime} target={event.startTime} />.
            </DarkModeCapableAlert>
        );
    } else if (dateTime.isBefore(event.endTime)) {
        return (
            <DarkModeCapableAlert elevation={1} sx={{ marginTop: { lg: 2 } }} severity="success">
                <strong>{event.name}</strong> is currently happening!
            </DarkModeCapableAlert>
        );
    } else {
        return (
            <DarkModeCapableAlert elevation={1} sx={{ marginTop: { lg: 2 } }} severity="info">
                <strong>{event.name} </strong>
                finished <TimeTicker dateTime={dateTime} target={event.endTime} />.
            </DarkModeCapableAlert>
        );
    }
}

// Props accepted by the <VolunteerShiftFellows> component.
interface VolunteerShiftFellowsProps {
    /**
     * Set of the volunteers who will be joining the signed in one during a shift.
     */
    volunteers: Set<EventVolunteer>;
}

// Convenience component for consistently formatting the list of volunteers who will be present at
// a particular shift. Display depends on the number of volunteers passed in the props.
function VolunteerShiftFellows(props: VolunteerShiftFellowsProps) {
    const { volunteers } = props;

    if (!volunteers.size)
        return <></>;

    const volunteerArray = [ ...volunteers ].sort();
    if (volunteerArray.length === 1)
        return <span>, together with {volunteerArray[0].firstName}</span>;
    else if (volunteerArray.length === 2)
        return <span>, together with {volunteerArray[0].firstName} and {volunteerArray[1].firstName}</span>;
    else
        return <span>, together with {volunteerArray.length} other volunteers</span>;
}

// Properties made available to the <VolunteerShiftOverview> component.
interface VolunteerShiftOverviewProps {
    /**
     * The DateTime instance for when the information should be shown.
     */
    dateTime: DateTime;

    /**
     * Tracker for the event for which we want to show the |volunteer|'s next shifts.
     */
    eventTracker: EventTracker;

    /**
     * The event for associated with the |eventTracker| and the |volunteer|.
     */
    event: Event;

    /**
     * The volunteer for whom the upcoming shift information should be displayed.
     */
    volunteer: EventVolunteer;
}

// The <VolunteerShiftOverview> component displays information about the volunteer's current and
// upcoming shifts during the event. This is only available when the volunteer has shifts.
function VolunteerShiftOverview(props: VolunteerShiftOverviewProps) {
    const { dateTime, eventTracker, volunteer } = props;

    // Both operations can be executed in constant time thanks to the EventTracker.
    const currentShift = eventTracker.getVolunteerActivity(volunteer);
    const upcomingShift = eventTracker.getVolunteerUpcomingShift(volunteer);

    // Determine the event to highlight for either the |currentShift| or the |upcomingShift|.
    let display = 'finished';

    let shift: EventShift | undefined;
    if (currentShift && typeof currentShift !== 'string' && currentShift.event) {
        shift = currentShift;
        display = 'active';
    } else if (upcomingShift && upcomingShift.event) {
        shift = upcomingShift;
        display = 'upcoming';
    }

    // TODO: This might end up being the wrong session, which could lead to a wrong location. For
    // the current event that's not the case, but we should have a more reliable determination.
    const session = shift?.event?.sessions[0];

    // Determine which volunteers will be helping out at the same time as |volunteer|.
    let volunteers: Set<EventVolunteer> = new Set();
    if (shift && shift.event) {
        for (const eventShift of shift.event.shifts) {
            if (eventShift.volunteer === volunteer)
                continue;  // don't include the |volunteer| themselves

            if (eventShift.endTime.isBefore(shift.startTime))
                continue;  // the |eventShift| has passed by the time |shift| starts

            if (shift.endTime.isBefore(eventShift.startTime))
                continue;  // the |shift| has passed before |eventShift| starts

            volunteers.add(eventShift.volunteer);
        }
    }

    // Linkify the card if a |shift| was set with a valid event.
    const href = (shift && shift.event)
                     ? `/schedule/${props.event.identifier}/event/${shift.event.identifier}/`
                     : undefined;

    return (
        <OverviewCard href={ href }
                      icon={ display === 'finished' ? <TaskAltIcon color="success" />
                                                    : <AssignmentIcon color="info" /> }>

            { display === 'finished' &&
                <Typography variant="body1">
                    You're done with all your shifts! Thank you for all your time and hard
                    work, {volunteer.firstName}, it helped make {props.event.name} a success!
                </Typography> }

            { (display === 'active' && shift && session) &&
                <>
                    <Typography variant="body2" gutterBottom>
                        You're currently on duty
                    </Typography>
                    <Typography variant="body1">
                        You're at the <strong>{session.name}</strong> shift at
                        the <strong>{session.location.name}</strong><VolunteerShiftFellows volunteers={volunteers} />.
                        Your shift <strong>finishes <TimeTicker dateTime={dateTime} target={shift.endTime} /></strong>.
                    </Typography>
                </> }

            { (display === 'upcoming' && shift && session) &&
                <>
                    <Typography variant="body2" gutterBottom>
                        Your upcoming shift
                    </Typography>
                    <Typography variant="body1">
                        Your <strong>{session.name}</strong> shift
                        will <strong>start <TimeTicker dateTime={dateTime} target={shift.startTime} /></strong> at
                        the <strong>{session.location.name}</strong><VolunteerShiftFellows volunteers={volunteers} />.
                        Please try to be there 15 minutes early.
                    </Typography>
                </> }

        </OverviewCard>
    );
}

// Properties made available to the <OverviewViewProps> component.
interface OverviewViewProps {
    /**
     * DateTime for which the <OverviewView> has been rendered.
     */
    dateTime: DateTime;

    /**
     * Tracker for the event for which we're showing the overview page.
     */
    eventTracker: EventTracker;

    /**
     * The event for which the overview page is being displayed.
     */
    event: Event;
}

// Displays the volunteer portal's overview page, which shows the volunteer basic information about
// the event, information about their shifts, and displays the events they've flagged. It's possible
// for people to be able to open this page without being a volunteer themselves.
export function OverviewView(props: OverviewViewProps) {
    const { dateTime, eventTracker, event } = props;
    const { user } = useContext(AppContext);

    const volunteer = eventTracker.getUserVolunteer();

    return (
        <Fragment>
            <AppTitle />

            <EventStatusDisplay dateTime={dateTime}
                                event={event} />

            { (volunteer && volunteer.shifts.length > 0) &&
                <VolunteerShiftOverview dateTime={dateTime}
                                        event={event} eventTracker={eventTracker}
                                        volunteer={volunteer} /> }

            { (!volunteer || !volunteer.shifts.length) &&
                <DarkModeCapableAlert severity="error" elevation={1} sx={{ mt: 2 }}>
                    <AlertTitle>Shifts are unavailable</AlertTitle>
                    Not all of the volunteer portal's functionality will be available because no
                    shifts have been scheduled for <strong>{user.name}</strong>. Are you even real?
                </DarkModeCapableAlert> }

            { /* flagged events */ }

            <EducationCard dateTime={dateTime} />

            { eventTracker.getActiveSessionCount() > 0 &&
                <NardoAdvice dateTime={dateTime} /> }

        </Fragment>
    );
}
