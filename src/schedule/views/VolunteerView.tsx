// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { Fragment, h } from 'preact';
import { route } from 'preact-router';
import { useContext, useMemo, useState } from 'preact/compat';

import AddCircleIcon from '@mui/icons-material/AddCircle';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Badge from '@mui/material/Badge';
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
import NotesIcon from '@mui/icons-material/Notes';
import Paper from '@mui/material/Paper';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import SmsIcon from '@mui/icons-material/Sms';
import Stack from '@mui/material/Stack';
import { SystemStyleObject, Theme, lighten, useTheme } from '@mui/system';
import Tooltip from '@mui/material/Tooltip';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import useMediaQuery from '@mui/material/useMediaQuery';

import { AppContext } from '../../AppContext';
import { AppTitle } from '../../AppTitle';
import { AvatarEditor } from '../components/AvatarEditor';
import { DateTime } from '../../base/DateTime';
import { EventTracker } from '../../base/EventTracker';
import { Event, EventShift, EventVolunteer } from '../../base/Event';
import { Markdown } from '../components/Markdown';
import { NotesEditor } from '../components/NotesEditor';
import { ShiftListItem } from '../components/ShiftListItem';
import { SubTitle } from '../components/SubTitle';
import { firstName } from '../../base/NameUtilities';
import { isAcceptedEventRole } from '../../base/User';
import { uploadNotes } from '../../base/Notes';

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
    avatarEditBadge: {
        '& .MuiBadge-badge': {
            backgroundColor: 'background.paper',
            color: 'primary.main',
            cursor: 'pointer',
            padding: '0',

            '&> svg': {
                fontSize: '1.25rem',
            }
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
    // DateTime for which the <VolunteerView> has been rendered.
    dateTime: DateTime;

    // Tracker for the event, which provides us access to real-time information.
    eventTracker: EventTracker;

    // The event for which we want to display the volunteer's information.
    event: Event;

    // Unique identifier for the volunteer whose information should be shown. When omitted, the user
    // who is currently logged in to the portal will have their information shown. When that's not
    // available either, a redirect to the portal's volunteers page will be issued instead.
    volunteerIdentifier?: string;
}

// The <VolunteerView> component lists all information about a particular volunteer, and enables
// the volunteer themselves, as well as seniors, to upload a modified photo to the server.
export function VolunteerView(props: VolunteerViewProps) {
    const { dateTime, event, eventTracker, volunteerIdentifier } = props;
    const { user } = useContext(AppContext);

    const userVolunteer = eventTracker.getUserVolunteer();
    const volunteer = volunteerIdentifier ? event.volunteer(volunteerIdentifier)
                                          : userVolunteer;

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

    // Whether the current |user| has the ability to edit the avatar of this |volunteer|. This is
    // controlled by the user privileges made available through the server.
    let canEditAvatar = event.hasUserPrivilege('update-avatar-any');
    if (!canEditAvatar && userVolunteer) {
        if (event.hasUserPrivilege('update-avatar-self') && userVolunteer === volunteer) {
            canEditAvatar = true;
        } else if (event.hasUserPrivilege('update-avatar-environment')) {
            const userEnvironmentIdentifiers = Object.keys(userVolunteer.environments);
            for (const userEnvironmentIdentifier of userEnvironmentIdentifiers) {
                const userRole = userVolunteer.environments[userEnvironmentIdentifier];
                if (!isAcceptedEventRole(userRole))
                    continue;  // the |user| isn't participating in the given environment

                if (!volunteer.environments.hasOwnProperty(userEnvironmentIdentifier) ||
                        !isAcceptedEventRole(volunteer.environments[userEnvironmentIdentifier])) {
                    continue;  // the |volunteer| isn't participating in the given environment
                }

                canEditAvatar = true;
                break;
            }
        }
    }

    // Toggles whether a dialog should be visible with the volunteer's avatar. When the user has the
    // ability to edit the avatar, this will open an editor. When they don't, a dialog will be
    // shown with a larger version of the avatar, likely displaying more information.
    const [ avatarDialogVisible, setAvatarDialogVisible ] = useState(false);

    // Called when the given |avatar| should be uploaded for this volunteer. It contains the exact
    // image data (resizes and cropped) as it should be shared with the server.
    async function requestAvatarUpload(avatar: Blob): Promise<boolean> {
        if (!volunteer)
            return false;  // no volunteer, likely a race condition after unloading the component

        const success = !!await volunteer.uploadAvatar({ avatar, authToken: user.authToken });

        // If the |user| and the |volunteer| are one and the same, which we very securely decide on
        // based on their full name, the |user| object will be updated with the new avatar too.
        if (user.name === volunteer.name)
            user.avatar = volunteer.avatar;

        return success;
    }

    // Uploads the given |notes| after the user made a change in the notes editor. This initiates a
    // network call, and may take an arbitrary amount of time to complete.
    const [ noteEditorOpen, setNoteEditorOpen ] = useState<boolean>(false);

    async function commitNoteEditor(notes: string) {
        if (!volunteer)
            return { error: 'Component has been detached' };

        try {
            const result =
                await uploadNotes(user, event.identifier, 'volunteer', volunteer.identifier, notes);

            if (!!result.error)
                return { error: result.error };

            volunteer.notes = result.notes;
            return true;

        } catch (error) {
            return { error: 'Unable to upload the notes: ' + error };
        }
    }

    // Only display the volunteer's first name on mobile devices in the interest of space, as senior
    // volunteers will have a whole slew of buttons on the right-hand side of their identification.
    const theme = useTheme();
    const title = useMediaQuery(theme.breakpoints.up('sm')) ? volunteer.name
                                                            : firstName(volunteer.name);

    type ShiftInfo = { endPast: boolean; shift: EventShift };
    type DailyShiftInfo = { remainingShifts: boolean; shifts: ShiftInfo[] };

    // Compile a list of the shifts that this volunteer will be part of. They're grouped by the day
    // the shift will start on, where days on which all sessions have passed will be moved to the
    // bottom of the list. This follows the same display as event sessions within a location.
    const [ shiftsByDay, sortedDays ] = useMemo(() => {
        const shiftsByDay: Record<string, DailyShiftInfo> = {};

        // (1) Aggregate all of the shifts by the day on which they'll take place.
        for (const shift of volunteer.shifts) {
            if (shift.type !== 'shift')
                continue;  // ignore available/unavailable time for this display

            const shiftDay = shift.startTime.format('date');

            if (!shiftsByDay.hasOwnProperty(shiftDay)) {
                shiftsByDay[shiftDay] = {
                    remainingShifts: false,
                    shifts: [],
                };
            }

            shiftsByDay[shiftDay].remainingShifts ||= dateTime.isBefore(shift.endTime);
            shiftsByDay[shiftDay].shifts.push({
                endPast: shift.endTime.isBefore(dateTime),
                shift,
            });
        }

        // (2) Apply the desired sort order to shifts on each individual day.
        for (const shiftDay in shiftsByDay) {
            shiftsByDay[shiftDay].shifts.sort((lhs, rhs) => {
                // (1) Move past shifts to the bottom of the list.
                if (lhs.endPast && !rhs.endPast)
                    return 1;
                if (!lhs.endPast && rhs.endPast)
                    return -1;

                // (2) Sort the active shifts based on the time at which they started.
                if (lhs.shift.startTime.isBefore(rhs.shift.startTime))
                    return -1;
                if (rhs.shift.startTime.isBefore(lhs.shift.startTime))
                    return 1;

                return 0;
            });
        }

        // (3) Apply the desired sort order to the days during which the volunteer has shifts.
        const sortedDays = Object.keys(shiftsByDay).sort((lhs, rhs) => {
            if (shiftsByDay[lhs].remainingShifts && !shiftsByDay[rhs].remainingShifts)
                return -1;
            if (!shiftsByDay[lhs].remainingShifts && shiftsByDay[rhs].remainingShifts)
                return 1;

            return lhs.localeCompare(rhs);
        });

        return [ shiftsByDay, sortedDays ];

    }, [ dateTime, volunteer ]);

    return (
        <Fragment>
            <AppTitle title={volunteer.name} />
            <Paper elevation={2} sx={{ maxWidth: '100vw', marginTop: { lg: 2 } }}>
                <List>
                    <ListItem>
                        <ListItemAvatar onClick={e => setAvatarDialogVisible(true)}>
                            { canEditAvatar &&
                                <Tooltip title="Upload photo">
                                    <Badge anchorOrigin={{horizontal: 'right', vertical: 'bottom'}}
                                           badgeContent={ <AddCircleIcon /> } color="info"
                                           overlap="circular" sx={kStyles.avatarEditBadge}>
                                        <Avatar alt={volunteer.name} src={volunteer.avatar}>
                                            <PersonIcon />
                                        </Avatar>
                                    </Badge>
                                </Tooltip> }
                            { !canEditAvatar &&
                                <Avatar alt={volunteer.name} src={volunteer.avatar}>
                                    <PersonIcon />
                                </Avatar> }
                        </ListItemAvatar>
                        <ListItemText primaryTypographyProps={{ sx: kStyles.nameTypography }}
                                      primary={title}
                                      secondary={role} />
                        { (volunteer.accessCode || volunteer.phoneNumber) &&
                            <Stack direction="row" spacing={2}>
                                { event.hasUserPrivilege('update-user-notes') &&
                                    <Tooltip title={`${volunteer.firstName}'s notes`}>
                                        <IconButton color="primary"
                                                    onClick={e => setNoteEditorOpen(true)}
                                                    size="medium"
                                                    sx={kStyles.actionButton}>
                                            <NotesIcon />
                                        </IconButton>
                                    </Tooltip> }

                                { volunteer.accessCode &&
                                    <Tooltip title="Access information">
                                        <IconButton color="primary"
                                                    onClick={e => setAccessCodeVisible(true)}
                                                    size="medium"
                                                    sx={kStyles.actionButton}>
                                            <VpnKeyIcon />
                                        </IconButton>
                                    </Tooltip>}
                                { volunteer.phoneNumber &&
                                    <Tooltip title="Give them a call">
                                        <IconButton color="primary"
                                                    href={`tel:${volunteer.phoneNumber}`}
                                                    size="medium"
                                                    sx={kStyles.actionButton}>
                                            <PhoneIcon />
                                        </IconButton>
                                    </Tooltip> }
                            </Stack> }
                    </ListItem>
                </List>
            </Paper>

            { volunteer.notes &&
                <Fragment>
                    <SubTitle>Notes</SubTitle>
                    <Paper elevation={2} sx={{ p: 2 }}>
                        <Markdown content={volunteer.notes} />
                    </Paper>
                </Fragment> }

            { sortedDays.length > 0 && sortedDays.map(dayLabel => {
                const { remainingShifts, shifts } = shiftsByDay[dayLabel];
                const header = shifts[0].shift.startTime.format('day');

                return (
                    <Fragment>
                        <SubTitle>{header} { !remainingShifts && '✔' }</SubTitle>
                        <Paper sx={{ maxWidth: '100vw' }}>
                            <List disablePadding>
                                { shifts.map(({ shift }) =>
                                    <ShiftListItem dateTime={dateTime}
                                                   display="event"
                                                   event={event}
                                                   shift={shift} /> ) }
                            </List>
                        </Paper>
                    </Fragment>
                );
            })}

            { sortedDays.length === 0 &&
                <Alert elevation={2} sx={{ p: 2, mt: 2 }} severity="warning">
                    {volunteer.firstName} does not have any shifts during {event.name}.
                </Alert> }

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

            { event.hasUserPrivilege('update-user-notes') &&
                <NotesEditor open={noteEditorOpen}
                             notes={volunteer.notes}
                             requestClose={() => setNoteEditorOpen(false)}
                             requestSave={commitNoteEditor} /> }

        </Fragment>
    );
}
