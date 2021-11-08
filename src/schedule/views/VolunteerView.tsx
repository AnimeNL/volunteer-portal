// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { Fragment, h } from 'preact';
import { route } from 'preact-router';
import { useContext } from 'preact/compat';

import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import ListItem from '@mui/material/ListItem';
import Paper from '@mui/material/Paper';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import Stack from '@mui/material/Stack';
import { SystemStyleObject, Theme, lighten } from '@mui/system';
import Typography from '@mui/material/Typography';
import VpnKeyIcon from '@mui/icons-material/VpnKey';

import { AppContext } from '../../AppContext';
import { AppTitle } from '../../AppTitle';
import { Event } from '../../base/Event';
import { SubTitle } from '../components/SubTitle';

// Styles for the <VolunteerView> component. Used to highlight the sort of interactions that are
// possible on this page, which depends on the user's access level.
const kStyles: Record<string, SystemStyleObject<Theme>> = {
    actionButton: {
        backgroundColor: theme => lighten(theme.palette.primary.main, .96),
        '&:hover': {
            '@media (hover: none)': {
                backgroundColor: theme => lighten(theme.palette.primary.main, .96),
            },
        }
    },
    nameTypography: {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
};

// Properties passed to the <VolunteerView> component.
export interface VolunteerViewProps {
    // The event for which we want to display the volunteer's information.
    event: Event;

    // Unique identifier for the volunteer whose information should be shown. When omitted, the user
    // who is currently logged in to the portal will have their information shown. When that's not
    // available either, a redirect to the portal's volunteers page will be issued instead.
    volunteerIdentifier?: string;
};

// The <VolunteerView> component lists all information about a particular volunteer, and enables
// the volunteer themselves, as well as seniors, to upload a modified photo to the server.
export function VolunteerView(props: VolunteerViewProps) {
    const { event, volunteerIdentifier } = props;
    const { user } = useContext(AppContext);

    const volunteer = volunteerIdentifier ? event.getVolunteer(volunteerIdentifier)
                                          : event.getVolunteerByName(user.name);

    if (!volunteer) {
        route(`/schedule/${event.identifier}/volunteers/`);
        return <></>;
    }

    // Display all roles assigned to the |volunteer|, across the environments that the |user| has
    // access to. A set is used to remove duplicate roles, which will be the common case.
    const role = [...new Set(Object.values(volunteer.environments))].join(', ');

    // TODO: Add a dialog to visualize this volunteer's access code.
    // TODO: Open the dialer when clicking on the phone icon, when available.
    // TODO: Clicking on the volunteer's icon should open the photo uploader.

    return (
        <Fragment>
            <AppTitle title={volunteer.name} />
            <Paper elevation={2} sx={{ maxWidth: '100vw', marginTop: { lg: 2 } }}>
                <List>
                    <ListItem>
                        <ListItemAvatar>
                            <Avatar alt={volunteer.name} src={volunteer.avatar}>
                                <PersonIcon />
                            </Avatar>
                        </ListItemAvatar>
                        <ListItemText primaryTypographyProps={{ sx: kStyles.nameTypography }}
                                      primary={volunteer.name}
                                      secondary={role} />

                        <Stack direction="row" spacing={2}>
                            <IconButton color="primary" size="large" sx={kStyles.actionButton}>
                                <VpnKeyIcon />
                            </IconButton>
                            <IconButton color="primary" size="large" sx={kStyles.actionButton}>
                                <PhoneIcon />
                            </IconButton>
                        </Stack>
                    </ListItem>
                </List>

            </Paper>
            <SubTitle>Shifts</SubTitle>
            <Paper elevation={2} sx={{ p: 2 }}>
                <Typography variant="body1">
                    <em>Shifts go here.</em>
                </Typography>
            </Paper>
        </Fragment>
    );
}
