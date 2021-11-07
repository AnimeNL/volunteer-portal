// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { Fragment, h } from 'preact';
import { useState } from 'preact/compat';

import Avatar from '@mui/material/Avatar';
import List from '@mui/material/List';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import PersonIcon from '@mui/icons-material/Person';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';

import { AppTitle } from '../../AppTitle';
import { Event, EventVolunteer } from '../../base/Event';

// Type defining what we mean by a "volunteer".
type VolunteerProps = { volunteer: EventVolunteer };

// The <Volunteer> component renders an individual volunteer, which always have to be displayed as
// a list item. The volunteer's component will be themed based on their current occupation.
function Volunteer(props: VolunteerProps) {
    const { volunteer } = props;

    // TODO: Display the volunteer's role within this event
    // TODO: Visually differentiate between volunteers, senior volunteers and staff
    // TODO: Visually identify the volunteer's availability
    // TODO: Visually identify their current occupation

    return (
        <ListItemButton>
            <ListItemAvatar>
                <Avatar alt={volunteer.name} src={volunteer.avatar}>
                    <PersonIcon />
                </Avatar>
            </ListItemAvatar>
            <ListItemText primary={volunteer.name}
                          secondary="Volunteer" />
        </ListItemButton>
    );
}

// Type defining what we mean by a "volunteer list".
type VolunteerListProps = { volunteers: EventVolunteer[], index?: number, value?: number };

// The <VolunteerList> component renders a list of volunteers. Each volunteer will be shown with
// an appropriate amount of meta-information to make the list immediately actionable.
function VolunteerList(props: VolunteerListProps) {
    const { volunteers, index, value } = props;

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
                        { volunteers.map(volunteer => <Volunteer volunteer={volunteer} />) }
                    </List>
                </Paper> }
        </div>
    );
}

// Properties available for the <VolunteerListView> component.
type VolunteerListViewProps = { event: Event };

// The <VolunteerListView> provides an overview of the volunteers who are participating in this
// event. There are two views: a singular list without headers for users who only see volunteers
// from a single environment, or multiple tabbed lists for folks who can access multiple.
export function VolunteerListView(props: VolunteerListViewProps) {
    const { event } = props;

    const [ selectedTabIndex, setSelectedTabIndex ] = useState(/* default tab= */ 0);

    const environments: Record<string, EventVolunteer[]> = {};
    for (const volunteer of event.getVolunteers()) {
        for (const environment of volunteer.environments) {
            if (!environments.hasOwnProperty(environment))
                environments[environment] = [];

            environments[environment].push(volunteer);
        }
    }

    const environmentNames = Object.getOwnPropertyNames(environments);
    switch (environmentNames.length) {
        case 0:
            return (
                <Fragment>
                    <AppTitle title="Volunteers" />
                    <Paper elevation={2} sx={{ p: 2, marginTop: { lg: 2 } }}>
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
                    <VolunteerList volunteers={environments[environmentNames[0]]} />
                </Fragment>
            );

        default:
            return (
                <Fragment>
                    <AppTitle title="Volunteers" />
                    <Tabs onChange={(_, value) => setSelectedTabIndex(value)}
                          value={selectedTabIndex}
                          variant="fullWidth"
                          scrollButtons="auto">

                        { environmentNames.map(name => <Tab label={name} />) }

                    </Tabs>

                    { environmentNames.map((name, index) =>
                        <VolunteerList volunteers={environments[name]}
                                       value={selectedTabIndex}
                                       index={index} />) }

                </Fragment>
            );
    }
}
