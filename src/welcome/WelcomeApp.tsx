// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { Fragment, h } from 'preact';
import { route } from 'preact-router';
import { useContext, useState } from 'preact/hooks';

import AppRegistrationIcon from '@mui/icons-material/AppRegistration';
import Button from '@mui/material/Button';
import ContactSupportIcon from '@mui/icons-material/ContactSupport';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import EventNoteIcon from '@mui/icons-material/EventNote';
import LanguageIcon from '@mui/icons-material/Language';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import NewReleasesIcon from '@mui/icons-material/NewReleases';
import { SxProps, Theme } from '@mui/system';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { AppContext } from '../AppContext';
import { ContentHeader } from '../ContentHeader';
import { ContentLayout } from '../ContentLayout';
import { IEnvironmentResponseEvent } from '../api/IEnvironment';
import { Link } from '../Link';
import { UserLoginDialog } from '../UserLoginDialog';
import { User } from '../base/User';
import { firstName } from '../base/NameUtilities';

// Customized styling for the <WelcomeApp> component.
const kStyles: { [key: string]: SxProps<Theme> } = {
    buttons: {
        paddingTop: 0,
        paddingRight: 3,
        paddingBottom: 2,
        paddingLeft: 0,
    },
    hidden: {
        backgroundColor: 'grey.200',
    },
    intro: {
        paddingX: 2,
        paddingY: 1,
    },
    list: {
        paddingBottom: '0px !important',
        paddingTop: '0px !important',
    },
};

// Returns whether the given |user| participates in the given |eventIdentifier|. This ignores a
// number of the predefined status codes that work towards their participation.
function userParticipatesInEvent(user: User, eventIdentifier: string): boolean {
    const role = user.events.get(eventIdentifier);
    if (role && !['Cancelled', 'Registered', 'Rejected', 'Unregistered'].includes(role))
        return true;

    return false;
}

// The "welcome" application is a generic content page that allows the user to either sign in to
// their account, granting portal access, or refer the user to one of the other pages or components.
export function WelcomeApp() {
    const { environment, user } = useContext(AppContext);

    const isAdministrator = user.authenticated && user.isAdministrator();

    // Accessing the schedule requires the user to be identified, which we don't necessarily know
    // at the time of click. If they're not, the user should be given the opportunity to sign in.
    // Even when a user has authenticated, they may not have signed up for that particular event.
    const [ authenticationDialogOpen, setAuthenticationDialogOpen ] = useState(false);

    const [ participationDialogOpen, setParticipationDialogOpen ] = useState(false);
    const [ participationDialogEvent, setParticipationDialogEvent ] =
        useState<IEnvironmentResponseEvent>();

    function handleScheduleAccessRequest(event: IEnvironmentResponseEvent): void {
        if (!user.authenticated) {
            setAuthenticationDialogOpen(true);
            setParticipationDialogEvent(event);
        } else if (!userParticipatesInEvent(user, event.identifier) && !user.isAdministrator()) {
            setParticipationDialogOpen(true);
            setParticipationDialogEvent(event);
        } else {
            route(`/schedule/${event.identifier}/`);
        }
    }

    function handleAuthenticationDialogClose() {
        if (user.authenticated && participationDialogEvent)
            route(`/schedule/${participationDialogEvent.identifier}/`);

        setAuthenticationDialogOpen(false);
    }

    return (
        <ContentLayout>
            <ContentHeader title={environment.title} />
            <Typography sx={kStyles.intro}>
                This site allows you to learn more about the perks and responsibilities of
                volunteering during one of our events, to register your interest in becoming a
                volunteer, and to get direct access to your personal schedule.
            </Typography>
            <Divider />
            <List sx={kStyles.list}>
                {environment.events.map(event =>
                    <Fragment>
                        { (event.enableContent || isAdministrator) &&
                            <ListItem sx={!event.enableContent ? kStyles.hidden : {}}
                                      component={Link} href={`/registration/${event.identifier}/`} divider button>
                                <ListItemIcon>
                                    <AppRegistrationIcon />
                                </ListItemIcon>
                                <ListItemText primary={`Interested in helping out during ${event.name}?`} />
                                { !event.enableContent &&
                                    <Tooltip title="Administrator access">
                                        <NewReleasesIcon htmlColor="#E57373" />
                                    </Tooltip> }
                            </ListItem>
                        }
                        { (event.enableSchedule || isAdministrator) &&
                            <ListItemButton divider sx={!event.enableSchedule ? kStyles.hidden : {}}
                                            onClick={() => handleScheduleAccessRequest(event)}>
                                <ListItemIcon>
                                    <EventNoteIcon />
                                </ListItemIcon>
                                <ListItemText primary={`Access the ${event.name} Volunteer Portal`} />
                                { !event.enableSchedule &&
                                    <Tooltip title="Administrator access">
                                        <NewReleasesIcon htmlColor="#E57373" />
                                    </Tooltip> }
                            </ListItemButton>
                        }
                        { (!event.enableContent && event.website) &&
                            <ListItem component="a" href={event.website} divider button>
                                <ListItemIcon>
                                    <LanguageIcon />
                                </ListItemIcon>
                                <ListItemText primary={`${event.name} isn't taking volunteer registrations. Visit the website instead.`} />
                            </ListItem>
                        }
                    </Fragment>
                )}
                { environment.contactName &&
                    <ListItem component={Link} href={environment.contactTarget} button>
                        <ListItemIcon>
                            <ContactSupportIcon />
                        </ListItemIcon>
                        <ListItemText primary={`Contact ${environment.contactName} for additional help with the portal…`} />
                    </ListItem>
                }
            </List>

            <UserLoginDialog onClose={handleAuthenticationDialogClose}
                             open={authenticationDialogOpen} />

            { (participationDialogEvent && user.authenticated) &&
                <Dialog onClose={() => setParticipationDialogOpen(false)}
                        open={participationDialogOpen}>

                    <DialogTitle>
                        {participationDialogEvent.name}
                    </DialogTitle>

                    <DialogContent>
                        <DialogContentText>
                            {firstName(user.name)}, you're not on the list for the {participationDialogEvent.name} {environment.themeTitle}!
                            { participationDialogEvent.enableRegistration &&
                                " Fortunately, there's still time for your application to go through if you continue to the event's mini site. " }
                            { !participationDialogEvent.enableRegistration &&
                                " Unfortunately, applications for this event have closed. Please contact one of the seniors if you think this is a mistake." }
                        </DialogContentText>
                    </DialogContent>

                    <DialogActions sx={kStyles.buttons}>
                        <Button onClick={() => setParticipationDialogOpen(false)}>Close</Button>
                        { participationDialogEvent.enableRegistration &&
                            <Button onClick={() => route(`/registration/${participationDialogEvent.identifier}/`)}
                                    variant="contained">Apply today!</Button> }
                    </DialogActions>
                </Dialog> }

        </ContentLayout>
    );
}
