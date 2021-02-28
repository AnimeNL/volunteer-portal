// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { Fragment, h } from 'preact';
import { useContext } from 'preact/hooks';

import ContactSupportIcon from '@material-ui/icons/ContactSupport';
import Divider from '@material-ui/core/Divider';
import InfoIcon from '@material-ui/icons/Info';
import LanguageIcon from '@material-ui/icons/Language';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';

import { AppContext } from '../AppContext';
import { ContentHeader } from '../ContentHeader';
import { ContentLayout } from '../ContentLayout';
import { Link } from '../Link';

// Customized styling for the <WelcomeApp> component.
const useStyles = makeStyles(theme => ({
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
    const { environment } = useContext(AppContext);

    return (
        <ContentLayout>
            <ContentHeader>
                {environment.title}
            </ContentHeader>
            <Typography className={classes.intro}>
                This site allows you to learn more about the perks and responsibilities of
                volunteering during one of our events, to register your interest to become a
                volunteer, and to get direct access to your personal schedule.
            </Typography>
            <Divider />
            <List className={classes.list}>
                {environment.events.map(event =>
                    <Fragment>
                        { event.enableRegistration &&
                            <ListItem component={Link} href={`/registration/${event.slug}/`} divider button>
                                <ListItemIcon>
                                    <InfoIcon />
                                </ListItemIcon>
                                <ListItemText primary={`Interested in helping out during ${event.name}?`} />
                            </ListItem>
                        }
                        { (!event.enableRegistration && event.website) &&
                            <ListItem component="a" href={event.website} divider button>
                                <ListItemIcon>
                                    <LanguageIcon />
                                </ListItemIcon>
                                <ListItemText primary={`We're not taking registrations yet, visit the ${event.name} website instead.`} />
                            </ListItem>
                        }
                        { /* TODO: Enable sign-in when the portal for |event| has been enabled. */ }
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
