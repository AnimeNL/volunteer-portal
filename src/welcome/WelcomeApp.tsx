// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { Fragment, h } from 'preact';
import { useContext } from 'preact/hooks';

import AppRegistrationIcon from '@mui/icons-material/AppRegistration';
import ContactSupportIcon from '@mui/icons-material/ContactSupport';
import Divider from '@mui/material/Divider';
import EventNoteIcon from '@mui/icons-material/EventNote';
import LanguageIcon from '@mui/icons-material/Language';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import NewReleasesIcon from '@mui/icons-material/NewReleases';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { makeStyles } from '@mui/material/styles';

import { AppContext } from '../AppContext';
import { ContentHeader } from '../ContentHeader';
import { ContentLayout } from '../ContentLayout';
import { Link } from '../Link';

// Customized styling for the <WelcomeApp> component.
const useStyles = makeStyles(theme => ({
    hidden: {
        backgroundColor: theme.palette.grey[200],
    },
    intro: {
        padding: theme.spacing(1, 2),
    },
    list: {
        paddingBottom: '0px !important',
        paddingTop: '0px !important',
    }
}));

// The "welcome" application is a generic content page that allows the user to either sign in to
// their account, granting portal access, or refer the user to one of the other pages or components.
export function WelcomeApp() {
    const classes = useStyles();
    const { environment, user } = useContext(AppContext);

    const isAdministrator = user.authenticated && user.isAdministrator();

    return (
        <ContentLayout>
            <ContentHeader title={environment.title} />
            <Typography className={classes.intro}>
                This site allows you to learn more about the perks and responsibilities of
                volunteering during one of our events, to register your interest in becoming a
                volunteer, and to get direct access to your personal schedule.
            </Typography>
            <Divider />
            <List className={classes.list}>
                {environment.events.map(event =>
                    <Fragment>
                        { (event.enableContent || isAdministrator) &&
                            <ListItem className={!event.enableContent ? classes.hidden : ''}
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
                            <ListItem className={!event.enableSchedule ? classes.hidden : ''}
                                      component={Link} href={`/schedule/${event.identifier}/`} divider button>
                                <ListItemIcon>
                                    <EventNoteIcon />
                                </ListItemIcon>
                                <ListItemText primary={`Access the ${event.name} Volunteer Portal`} />
                                { !event.enableSchedule &&
                                    <Tooltip title="Administrator access">
                                        <NewReleasesIcon htmlColor="#E57373" />
                                    </Tooltip> }
                            </ListItem>
                        }
                        { (!event.enableContent && event.website) &&
                            <ListItem component="a" href={event.website} divider button>
                                <ListItemIcon>
                                    <LanguageIcon />
                                </ListItemIcon>
                                <ListItemText primary={`${event.name} isn't taking volunteer registrations yet. Visit the website instead.`} />
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
        </ContentLayout>
    );
}
