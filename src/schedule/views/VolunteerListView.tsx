// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { Fragment, h } from 'preact';
import { route } from 'preact-router';
import { useMemo, useState } from 'preact/compat';

import Avatar from '@mui/material/Avatar';
import List from '@mui/material/List';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import ListItem from '@mui/material/ListItem';
import Paper from '@mui/material/Paper';
import Snackbar from '@mui/material/Snackbar';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';

import { AppTitle } from '../../AppTitle';
import { DarkModeCapableAlert } from '../components/DarkModeCapableAlert';
import { DateTime } from '../../base/DateTime';
import { EventTracker } from '../../base/EventTracker';
import { Event, EventShift, EventVolunteer } from '../../base/Event';
import { initials } from '../../base/NameUtilities';

// Storage index (in localStorage) for the pinned team. This is a feature for power users who have
// the ability to display multiple teams in the portal at once.
const kPinnedTeamStorageKey = 'vp-pinned-team-index';

// Represents information about an individual volunteer within the volunteer portal.
interface VolunteerEntry {
    /**
     * The current activity of this volunteer.
     */
    currentActivity: EventShift | 'available' | 'unavailable';

    /**
     * The volunteer that's being described by this entry.
     */
    volunteer: EventVolunteer;
}

// Represents information about a group of volunteers within the volunteer portal.
interface VolunteerGroup {
    /**
     * Number of volunteers within this group who are actively doing a shift.
     */
    activeShifts: number;

    /**
     * Array of the volunteers within this group, already sorted by display order.
     */
    volunteers: VolunteerEntry[];
}

// Function to get the pinned team's index. Wrapped in a try/catch for Safari behaviour.
function getPinnedTeam(): number | null {
    try {
        const value = localStorage.getItem(kPinnedTeamStorageKey);
        if (value !== null)
            return parseInt(value, 10);
    } catch (error) {}

    return null;  // not found
}

// Function to set the pinned team's index. Wrapped in a try/catch for Safari behaviour, but also
// for other browsers who throw an exception when the storage is full.
function setPinnedTeam(index: null | number): void {
    try {
        if (index === null)
            localStorage.removeItem(kPinnedTeamStorageKey);
        else
            localStorage.setItem(kPinnedTeamStorageKey, index.toString());
    } catch (error) {}
}

// Returns whether the given |role| represents a senior volunteer.
function isSenior(role?: string): boolean {
    return role !== undefined && (role.includes('Senior') || role.includes('Staff'));
}

// Properties accepted by the <Volunteer> component.
interface VolunteerProps {
    /**
     * The volunteer for whom this component is being drawn.
     */
    volunteerEntry: VolunteerEntry;

    /**
     * When known, the identifier will be used to link from this volunteer tile to a page on which
     * their activities can be seen. Volunteers will not be clickable unless this has been provided.
     */
    identifier: string;

    /**
     * When known, the environment can be specified to specialize the volunteer's role that will be
     * displayed, which can theoretically differ between environments.
     */
    environment: string;
};

// The <Volunteer> component renders an individual volunteer, which always have to be displayed as
// a list item. The volunteer's component will be themed based on their current occupation.
function Volunteer(props: VolunteerProps) {
    const { volunteer } = props.volunteerEntry;

    // TODO: Visually identify the volunteer's availability
    // TODO: Visually identify their current occupation

    // The component used for the volunteer's entry depends on whether or not we can linkify it. An
    // ignore is necessary in the TSX later on, as the properties for both options differ slightly.
    const ListComponent = props.identifier ? ListItemButton : ListItem;

    function handleClick() {
        if (props.identifier)
            route(`/schedule/${props.identifier}/volunteers/${volunteer.identifier}/`);
    }

    // The role a volunteer has may differ depending on the environment. When it hasn't been
    // specifically included in the |props|, assume that this is not the case.
    const role = props.environment ? volunteer.environments[props.environment]
                                   : Object.values(volunteer.environments).shift();

    return (
        <Fragment>
            { /* @ts-ignore */ }
            <ListComponent onClick={handleClick}>
                <ListItemAvatar>
                    <Avatar alt={volunteer.name} src={volunteer.avatar}>
                        {initials(volunteer.name)}
                    </Avatar>
                </ListItemAvatar>
                <ListItemText primary={volunteer.name}
                              secondaryTypographyProps={{
                                  sx: { fontWeight: isSenior(role) ? 'bold' : 'normal' }
                              }}
                              secondary={role} />
            </ListComponent>
        </Fragment>
    );
}

// Properties accepted by the <VolunteerList> component.
interface VolunteerListProps {
    /**
     * The group of volunteers accepted by this component.
     */
    volunteerGroup: VolunteerGroup;

    /**
     * When known, the environment can help specialize display of individual volunteers, whereas the
     * event identifier is necessary to be able to link volunteers to the right location.
     */
    identifier: string;
    environment: string;

    /**
     * When used in a tab display, the full list doesn't always have to be displayed. The following
     * two properties can be used to identify and deal with that situation.
     */
    index?: number;
    value?: number;
};

// The <VolunteerList> component renders a list of volunteers. Each volunteer will be shown with
// an appropriate amount of meta-information to make the list immediately actionable.
function VolunteerList(props: VolunteerListProps) {
    const { volunteerGroup, environment, identifier, index, value } = props;

    // The list will be hidden when used in a tab switcher, and it's not the selected item.
    const visible = index === undefined || index === value;

    // Visual appearance of the volunteer list will depend on how the element is positioned. Tabs
    // impose some slight differences, and ask for no top padding on desktop platforms.
    const desktopMarginTop = index === undefined ? 2 : 0;
    const square = index !== undefined;

    return (
        <div hidden={!visible} role="tabpanel">
            { visible &&
                <Paper square={square} sx={{ marginTop: { lg: desktopMarginTop } }}>
                    <List>
                        { volunteerGroup.volunteers.map(entry =>
                            <Volunteer environment={environment}
                                       identifier={identifier}
                                       volunteerEntry={entry} />) }
                    </List>
                </Paper> }
        </div>
    );
}

// Properties available for the <VolunteerListView> component.
interface VolunteerListViewProps {
    /**
     * DateTime for which the <VolunteerListView> has been rendered.
     */
    dateTime: DateTime;

    /**
     * The Event instance that's active in the scheduling application.
     */
    event: Event;

    /**
     * The event tracker keeping track of live state of everything that's going on.
     */
    eventTracker: EventTracker;
};

// The <VolunteerListView> provides an overview of the volunteers who are participating in this
// event. There are two views: a singular list without headers for users who only see volunteers
// from a single environment, or multiple tabbed lists for folks who can access multiple.
export function VolunteerListView(props: VolunteerListViewProps) {
    const { dateTime, event, eventTracker } = props;

    // Use a memoized representation of the environments because we consult a fair amount of data
    // and sort the results, which, for larger groups of volunteers, quickly becomes non-trivial.
    const [ environments, environmentNames, defaultPin ] = useMemo(() => {
        const environments: Record<string, VolunteerGroup> = {};

        // Compile each of the groups of volunteers that the signed in user has access to by
        // iterating over all known volunteers. The eventTracker will be consulted for their state.
        for (const volunteer of event.volunteers()) {
            const volunteerEntry: VolunteerEntry = {
                currentActivity: eventTracker.getVolunteerActivity(volunteer),
                volunteer,
            };

            for (const environment of Object.keys(volunteer.environments)) {
                if (!environments.hasOwnProperty(environment))
                    environments[environment] = { activeShifts: 0, volunteers: [] };

                if (typeof volunteerEntry.currentActivity !== 'string')
                    environments[environment].activeShifts++;

                environments[environment].volunteers.push(volunteerEntry);
            }
        }

        const environmentNames = Object.getOwnPropertyNames(environments).sort();
        const userVolunteer = eventTracker.getUserVolunteer();

        // Determine the tab that should be pinned by default. When the user is signed in, their
        // environment will be preferred over the other tabs that are being displayed.
        let defaultPin: number = /* alphabetically the first environment= */ 0;

        if (userVolunteer && environmentNames.length > 1) {
            for (const userEnvironmentName in userVolunteer.environments) {
                const index = environmentNames.indexOf(userEnvironmentName);
                if (index === -1)
                    continue;  // the |userVolunteer| does not participate in this environment

                defaultPin = index;
                break;
            }
        }

        // Sort the lists of volunteers for each of the environments. Unavailable volunteers will
        // be moved to the bottom of the list, otherwise they will be sorted by name.
        for (const environment in environments) {
            environments[environment].volunteers.sort((lhs, rhs) => {
                if (lhs.currentActivity === 'unavailable' && rhs.currentActivity !== 'unavailable')
                    return 1;
                if (rhs.currentActivity === 'unavailable' && lhs.currentActivity !== 'unavailable')
                    return -1;

                return lhs.volunteer.name.localeCompare(rhs.volunteer.name);
            });
        }

        return [ environments, environmentNames, defaultPin ];

    }, [ dateTime ]);

    // The actual view will depend on the number of environments that are accessible to the signed
    // in volunteer. Three options: none, one or many.
    switch (environmentNames.length) {
        case 0:
            return (
                <Fragment>
                    <AppTitle title="Volunteers" />
                    <Paper elevation={2} sx={{ p: 2, marginTop: { md: 2 } }}>
                        <Typography variant="body1">
                            There are no volunteers for {event.name} yet for whom a schedule has
                            been published. Please be on the lookout for an e-mail from the team!
                        </Typography>
                    </Paper>
                </Fragment>
            );

        case 1:
            return (
                <Fragment>
                    <AppTitle title="Volunteers" />
                    <VolunteerList environment={environmentNames[0]}
                                   identifier={event.identifier}
                                   volunteerGroup={environments[environmentNames[0]]} />
                </Fragment>
            );

        default:
            // The tabbed view, used by most seniors and staff members, has additional functionality
            // to optimise their journeys, given that they're likely to be power users.
            //
            // *** Pinned Environments
            //
            //    By double clicking (or tapping) the environment's tab, it will become "pinned"
            //    and become the default environment for the VolunteerListView.
            //
            // Any changes to these settings will be communicated to the user through a snackbar.

            const [ pinnedOpen, setPinnedOpen ] = useState(/* default= */ false);
            const [ unpinnedOpen, setUnpinnedOpen ] = useState(/* default= */ false);

            // Mutable by the togglePin() function for label display.
            let pinnedTeam = getPinnedTeam();

            function togglePin(index: number) {
                if (getPinnedTeam() === index) {
                    setUnpinnedOpen(true);
                    setPinnedTeam(pinnedTeam = null);
                } else {
                    setPinnedOpen(true);
                    setPinnedTeam(pinnedTeam = index);
                }
            }

            // Validate the |pinnedTeam| storage option to make sure it exists and is within bounds.
            const validatedPinnedTeam =
                pinnedTeam === null || pinnedTeam < 0 || pinnedTeam >= environmentNames.length
                    ? /* default value= */ defaultPin
                    : pinnedTeam;

            const [ selectedTabIndex, setSelectedTabIndex ] = useState(validatedPinnedTeam);

            return (
                <Fragment>
                    <AppTitle title="Volunteers" />
                    <Tabs onChange={(_, value) => setSelectedTabIndex(value)}
                          value={selectedTabIndex}
                          variant="fullWidth"
                          scrollButtons="auto">

                        { environmentNames.map((name, index) => {
                            const prefix = pinnedTeam === index ? '📌 ' : '';

                            return <Tab onDoubleClick={_ => togglePin(index)}
                                        label={prefix + name} />;

                        }) }

                    </Tabs>

                    { environmentNames.map((name, index) =>
                        <VolunteerList volunteerGroup={environments[name]}
                                       environment={name}
                                       identifier={event.identifier}
                                       value={selectedTabIndex}
                                       index={index} />) }

                    <Snackbar autoHideDuration={2000} onClose={_ => setPinnedOpen(false)} open={pinnedOpen}>
                        <DarkModeCapableAlert severity="success" variant="filled">
                            Team has been pinned
                        </DarkModeCapableAlert>
                    </Snackbar>

                    <Snackbar autoHideDuration={2000} onClose={_ => setUnpinnedOpen(false)} open={unpinnedOpen}>
                        <DarkModeCapableAlert severity="info" variant="filled">
                            Team has been unpinned
                        </DarkModeCapableAlert>
                    </Snackbar>

                </Fragment>
            );
    }
}
