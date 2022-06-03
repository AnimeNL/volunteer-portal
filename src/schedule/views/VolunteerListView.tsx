// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { Fragment, h } from 'preact';
import { route } from 'preact-router';
import { useMemo, useState } from 'preact/compat';

import sx from 'mui-sx';

import Avatar from '@mui/material/Avatar';
import List from '@mui/material/List';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Snackbar from '@mui/material/Snackbar';
import { SxProps, Theme } from '@mui/system';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import { darken, lighten } from '@mui/material/styles';
import grey from '@mui/material/colors/grey';

import { AppTitle } from '../../AppTitle';
import { DarkModeCapableAlert } from '../components/DarkModeCapableAlert';
import { DateTime } from '../../base/DateTime';
import { EventTracker } from '../../base/EventTracker';
import { Event, EventShift, EventVolunteer } from '../../base/Event';
import { initials } from '../../base/NameUtilities';

// Storage index (in localStorage) for the pinned team. This is a feature for power users who have
// the ability to display multiple teams in the portal at once.
const kPinnedTeamStorageKey = 'vp-pinned-team-index';

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

// CSS customizations applied to the <Volunteer> component.
const kStyles: { [key: string]: SxProps<Theme> } = {
    active: {
        backgroundColor: theme => {
            return theme.palette.mode === 'dark' ? darken(/* green[900]= */ '#1B5E20', .25)
                                                 : lighten(theme.palette.success.light, .9);
        },
    },
    unavailableAvatar: {
        filter: theme => {
            return theme.palette.mode === 'dark' ? 'grayscale(1) brightness(0.6)'
                                                 : 'grayscale(1) brightness(0.8)';
        },
    },
    unavailable: {
        backgroundColor: theme => {
            return theme.palette.mode === 'dark' ? lighten(grey[900], .01)
                                                 : grey[300];
        },

        color: theme => {
            return theme.palette.mode === 'dark' ? grey[600]
                                                 : theme.palette.common.black;
        },
    },
};

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
    const { environment, identifier, volunteerEntry } = props;
    const { currentActivity, volunteer } = volunteerEntry;

    // TODO: Visually identify their current occupation

    // The |currentActivity| carries all neccesary information to decide the state of this volunteer
    const state = typeof currentActivity !== 'string' ? 'active'
                                                      : currentActivity;

    function handleClick() {
        route(`/schedule/${identifier}/volunteers/${volunteer.identifier}/`);
    }

    return (
        <ListItemButton onClick={handleClick}
                        sx={sx({ condition: state === 'active', sx: kStyles.active },
                               { condition: state === 'unavailable', sx: kStyles.unavailable }) }>

            <ListItemAvatar>
                <Avatar sx={ state === 'unavailable' ? kStyles.unavailableAvatar : undefined }
                        alt={volunteer.name} src={volunteer.avatar}>
                    {initials(volunteer.name)}
                </Avatar>
            </ListItemAvatar>

            <ListItemText primary={volunteer.name}
                          secondary={volunteer.environments[environment]} />

        </ListItemButton>
    );
}

// Properties accepted by the <VolunteerList> component.
interface VolunteerListProps {
    /**
     * The group of volunteers accepted by this component.
     */
    volunteerEntries: VolunteerEntry[];

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
    const { volunteerEntries, environment, identifier, index, value } = props;

    // The list will be hidden when used in a tab switcher, and it's not the selected item.
    const visible = index === undefined || index === value;

    // Visual appearance of the volunteer list will depend on how the element is positioned. Tabs
    // impose some slight differences, and ask for no top padding on desktop platforms.
    const desktopMarginTop = index === undefined ? 2 : 0;
    const square = index !== undefined;

    return (
        <div hidden={!visible} role="tabpanel">
            { visible &&
                <Paper square={square} sx={{ marginTop: { lg: desktopMarginTop }, mb: 2 }}>
                    <List disablePadding>
                        { volunteerEntries.map(entry =>
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
        const environments: Record<string, VolunteerEntry[]> = {};

        // Compile each of the groups of volunteers that the signed in user has access to by
        // iterating over all known volunteers. The eventTracker will be consulted for their state.
        for (const volunteer of event.volunteers()) {
            const volunteerEntry: VolunteerEntry = {
                currentActivity: eventTracker.getVolunteerActivity(volunteer),
                volunteer,
            };

            for (const environment of Object.keys(volunteer.environments)) {
                if (!environments.hasOwnProperty(environment))
                    environments[environment] = [];

                environments[environment].push(volunteerEntry);
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
            environments[environment].sort((lhs, rhs) => {
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
                                   volunteerEntries={environments[environmentNames[0]]} />
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

                        { environmentNames.map((name, index) =>
                            <Tab onDoubleClick={_ => togglePin(index)}
                                 label={pinnedTeam === index ? `📌 ${name}` : name} /> )}

                    </Tabs>

                    { environmentNames.map((name, index) =>
                        <VolunteerList volunteerEntries={environments[name]}
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
