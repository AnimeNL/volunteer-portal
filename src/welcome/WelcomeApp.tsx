// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { Fragment, h } from 'preact';
import { useContext } from 'preact/hooks';

import AppRegistrationIcon from '@material-ui/icons/AppRegistration';
import ContactSupportIcon from '@material-ui/icons/ContactSupport';
import Divider from '@material-ui/core/Divider';
import EventNoteIcon from '@material-ui/icons/EventNote';
import LanguageIcon from '@material-ui/icons/Language';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import NewReleasesIcon from '@material-ui/icons/NewReleases';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';

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
                volunteering during one of our events, to register your interest to become a
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
                                        <NewReleasesIcon color="disabled" />
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
                                        <NewReleasesIcon color="disabled" />
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
