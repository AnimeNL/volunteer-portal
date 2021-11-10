// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { Fragment, h } from 'preact';
import { route } from 'preact-router';
import { useContext, useState } from 'preact/compat';

import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import ListItem from '@mui/material/ListItem';
import Paper from '@mui/material/Paper';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import SmsIcon from '@mui/icons-material/Sms';
import Stack from '@mui/material/Stack';
import { SystemStyleObject, Theme, lighten } from '@mui/system';
import Typography from '@mui/material/Typography';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';

import { AppContext } from '../../AppContext';
import { AppTitle } from '../../AppTitle';
import { AvatarEditor } from '../components/AvatarEditor';
import { Event, EventVolunteer } from '../../base/Event';
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

// Creates a message (in Dutch, because meh) containing the |accessCode| for the given volunteer,
// which can be shared with them directly in case they forgot their code.
function createAccessCodeLink(volunteer: EventVolunteer, type: 'sms' | 'whatsapp'): string {
    const courtesy = `Hoi ${volunteer.firstName}, je toegangscode voor ${document.domain} is `;
    const accessCode =
        type === 'whatsapp' ? `*${volunteer.accessCode}*` : volunteer.accessCode;

    const encodedMessage = encodeURIComponent(courtesy + accessCode);

    switch (type) {
        case 'sms':
            return `sms://${volunteer.phoneNumber}?body=${encodedMessage}`;
        case 'whatsapp':
            return `https://wa.me/${volunteer.phoneNumber}?text=${encodedMessage}`;
    }
}

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

    // Toggles whether the access code should be visible, which is done as part of a <Dialog>
    // component. The component will only be added when an access code is known for this volunteer.
    const [ accessCodeVisible, setAccessCodeVisible ] = useState(false);

    // Whether the current |user| has the ability to edit the avatar of this |volunteer|.
    const canEditAvatar = true;

    // Toggles whether a dialog should be visible with the volunteer's avatar. When the user has the
    // ability to edit the avatar, this will open an editor. When they don't, a dialog will be
    // shown with a larger version of the avatar, likely displaying more information.
    const [ avatarDialogVisible, setAvatarDialogVisible ] = useState(false);

    // Called when the given |avatar| should be uploaded for this volunteer. It contains the exact
    // image data (resizes and cropped) as it should be shared with the server.
    async function requestAvatarUpload(avatar: Blob): Promise<boolean> {
        if (!volunteer)
            return false;  // no volunteer, likely a race condition after unloading the component

        const success = !!await volunteer.uploadAvatar(user, avatar);

        // If the |user| and the |volunteer| are one and the same, which we very securely decide on
        // based on their full name, the |user| object will be updated with the new avatar too.
        if (user.name === volunteer.name)
            user.avatar = volunteer.avatar;

        return success;
    }

    // TODO: Show the sessions this volunteer will be participating in.

    return (
        <Fragment>
            <AppTitle title={volunteer.name} />
            <Paper elevation={2} sx={{ maxWidth: '100vw', marginTop: { lg: 2 } }}>
                <List>
                    <ListItem>
                        <ListItemAvatar onClick={e => setAvatarDialogVisible(true)}>
                            <Avatar alt={volunteer.name} src={volunteer.avatar}>
                                <PersonIcon />
                            </Avatar>
                        </ListItemAvatar>
                        <ListItemText primaryTypographyProps={{ sx: kStyles.nameTypography }}
                                      primary={volunteer.name}
                                      secondary={role} />
                        { (volunteer.accessCode || volunteer.phoneNumber) &&
                            <Stack direction="row" spacing={2}>
                                { volunteer.accessCode &&
                                    <IconButton color="primary"
                                                onClick={e => setAccessCodeVisible(true)}
                                                size="large"
                                                sx={kStyles.actionButton}>
                                        <VpnKeyIcon />
                                    </IconButton> }
                                { volunteer.phoneNumber &&
                                    <IconButton color="primary"
                                                href={`tel:${volunteer.phoneNumber}`}
                                                size="large"
                                                sx={kStyles.actionButton}>
                                        <PhoneIcon />
                                    </IconButton> }
                            </Stack> }
                    </ListItem>
                </List>
            </Paper>
            <SubTitle>Shifts</SubTitle>
            <Paper elevation={2} sx={{ p: 2 }}>
                <Typography variant="body1">
                    <em>Shifts go here.</em>
                </Typography>
            </Paper>
            { volunteer.accessCode &&
                <Dialog onClose={e => setAccessCodeVisible(false)}
                        open={accessCodeVisible}>

                    <DialogTitle>Access code</DialogTitle>
                    <DialogContent>
                        {volunteer.firstName}'s access code for {event.name} is
                        <strong> {volunteer.accessCode}</strong>
                    </DialogContent>
                    { volunteer.phoneNumber &&
                        <DialogActions sx={{ justifyContent: 'flex-start', p: 3, paddingTop: 0 }}>
                            <Button href={createAccessCodeLink(volunteer, 'sms')}
                                    startIcon={ <SmsIcon /> }
                                    variant="outlined">
                                SMS
                            </Button>
                            <Button href={createAccessCodeLink(volunteer, 'whatsapp')}
                                    startIcon={ <WhatsAppIcon /> }
                                    variant="outlined">
                                WhatsApp
                            </Button>
                        </DialogActions> }
                </Dialog> }

            { canEditAvatar &&
                <AvatarEditor requestClose={() => setAvatarDialogVisible(false)}
                              requestUpload={requestAvatarUpload}
                              open={avatarDialogVisible}
                              src={volunteer.avatar} /> }

            { (!canEditAvatar && volunteer.avatar) &&
                <Dialog onClose={e => setAvatarDialogVisible(false)}
                        open={avatarDialogVisible}>

                    <DialogTitle>{volunteer.name}</DialogTitle>
                    <DialogContent>
                        <img src={volunteer.avatar} />
                    </DialogContent>

                </Dialog> }

        </Fragment>
    );
}
