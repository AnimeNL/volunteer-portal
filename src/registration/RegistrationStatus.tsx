// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { ComponentChild, Fragment, h } from 'preact';
import { useContext } from 'preact/hooks';

import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Divider from '@mui/material/Divider';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import Typography from '@mui/material/Typography';
import lightGreen from '@mui/material/colors/lightGreen'
import { lighten } from '@mui/material/styles';
import { makeStyles } from '@mui/material/styles';
import red from '@mui/material/colors/red';
import yellow from '@mui/material/colors/yellow';

import { AppContext } from '../AppContext';
import { EnvironmentEvent } from '../base/Environment';

// CSS customizations applied to the <RegistrationContent> component.
const useStyles = makeStyles(theme => ({
    containerAccepted: { backgroundColor: lightGreen[200] },
    containerDefault: { backgroundColor: lighten(theme.palette.primary.light, .9) },
    containerPending: { backgroundColor: yellow[100] },
    containerRejected: { backgroundColor: lighten(theme.palette.error.main, .8) },

    details: {
        padding: theme.spacing(0, 2, 1, 2),
    },

    divider: {
        marginBottom: theme.spacing(1),
    },

    summary: { minHeight: 'auto' },
    summaryContent: { margin: theme.spacing(1, 0, 0.8, 0) },
    summaryIcon: {
        lineHeight: 'normal',
        paddingRight: theme.spacing(1),
        paddingTop: '1px',
    },
}));

// Properties accepted by the <RegistrationStatus> component.
export interface RegistrationStatusProps {
    // The event for which the registration status notification is being shown.
    event: EnvironmentEvent;
}

// The <RegistrationStatus> component shares information about the status of one's registration with
// the volunteer visiting the portal. This allows people to always have the most up-to-date
// information on what role they have been assigned during the event, if any.
export function RegistrationStatus(props: RegistrationStatusProps) {
    const { event } = props;
    const { user } = useContext(AppContext);
    const classes = useStyles();

    if (!user.authenticated)
        return <Fragment />;

    const eventRole = user.events.get(event.identifier);

    let className: string = classes.containerDefault;
    let icon: ComponentChild = <HowToVoteIcon fontSize="inherit" />;
    let title: ComponentChild = `You haven't signed up for this event yet.`;
    let explanation: ComponentChild = (
        <Fragment>
            We haven't received your application to help out during <strong>{event.name}</strong>.
            { !event.enableRegistration &&
              <> The registration period is currently open, so don't wait any longer and let us know
                 about your interest to volunteer during the event!</> }
            { event.enableRegistration &&
              <> Unfortunately we aren't taking registrations at the moment, but keep an eye out on
                 this website to be the first to know once that changes. </> }
        </Fragment>
    );

    if (eventRole !== undefined) {
        switch (eventRole) {
            case 'Unregistered':
                break;  // default role, no need to special case

            case 'Registered':
                className = classes.containerPending;
                icon = <HowToVoteIcon style={{ color: yellow[900] }} fontSize="inherit" />;
                title = <>Your application is <b>being considered</b>.</>;
                explanation = (
                    <Fragment>
                        We have received your application for <strong>{event.name}</strong> and have
                        it under consideration. We will confirm your participation as soon as we can.
                        Please feel free to send us a message in case you have any questions.
                    </Fragment>
                );

                break;

            case 'Rejected':
                className = classes.containerRejected;
                icon = <ThumbDownIcon style={{ color: red[800] }} fontSize="inherit" />;
                title = <>Your participation has been <b>declined</b>.</>;
                explanation = (
                    <Fragment>
                        Unfortunately we have not been able to offer you participation in the
                        <strong> {event.name}</strong> team. You have received a message with more
                        information.
                    </Fragment>
                );
                break;

            default:
                className = classes.containerAccepted;
                icon = <ThumbUpIcon style={{ color: lightGreen[900] }} fontSize="inherit" />;
                title = <>Your participation has been <b>confirmed</b> ({eventRole}).</>;
                explanation = (
                    <Fragment>
                        We're very happy with your application and your participation during
                        <strong> {event.name}</strong> has been confirmed. You have received a
                        message with more information.
                    </Fragment>
                );
                break;
        }
    }

    return (
        <Fragment>
            <Accordion className={className} disableGutters>
                <AccordionSummary className={classes.summary}
                                  classes={{ content: classes.summaryContent }}
                                  expandIcon={<ExpandMoreIcon />}>
                    <div className={classes.summaryIcon}>
                        {icon}
                    </div>
                    <Typography variant="body2">
                        {title}
                    </Typography>
                </AccordionSummary>
                <AccordionDetails className={classes.details}>
                    <Divider className={classes.divider} />
                    {explanation}
                </AccordionDetails>
            </Accordion>
        </Fragment>
    );
}
