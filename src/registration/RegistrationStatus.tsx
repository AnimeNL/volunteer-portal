// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { ComponentChild, Fragment, h } from 'preact';
import { useContext } from 'preact/hooks';

import Accordion from '@material-ui/core/Accordion';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import Divider from '@material-ui/core/Divider';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import HowToVoteIcon from '@material-ui/icons/HowToVote';
import ThumbDownIcon from '@material-ui/icons/ThumbDown';
import ThumbUpIcon from '@material-ui/icons/ThumbUp';
import Typography from '@material-ui/core/Typography';
import lightGreen from '@material-ui/core/colors/lightGreen'
import { lighten } from '@material-ui/core/styles';
import { makeStyles } from '@material-ui/core/styles';
import red from '@material-ui/core/colors/red';
import yellow from '@material-ui/core/colors/yellow';

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
    summaryContent: { margin: theme.spacing(1, 0) },
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
    let title: ComponentChild = 'Je hebt je nog niet aangemeld voor dit evenement.';
    let explanation: ComponentChild = (
        <Fragment>
            We hebben je aanmelding voor <strong>{event.name}</strong> nog niet mogen ontvangen.
            { !event.enableRegistration &&
              <> Op dit moment worden er geen aanmeldingen aangenomen, maar houd deze website in de
                 gaten om de eerste te zijn zodra dat veranderd.</> }
            { event.enableRegistration &&
              <> Aanmeldingen worden op dit moment aangenomen, dus wacht niet langer en laat ons
                 weten dat je interesse hebt om mee te helpen!</> }
        </Fragment>
    );

    if (eventRole !== undefined) {
        switch (eventRole) {
            case 'Unregistered':
                break;  // default role, no need to special case

            case 'Registered':
                className = classes.containerPending;
                icon = <HowToVoteIcon style={{ color: yellow[900] }} fontSize="inherit" />;
                title = <>Je aanmelding is <b>onder behandeling</b>.</>;
                explanation = (
                    <Fragment>
                        We hebben je aanmelding voor <strong>{event.name}</strong> ontvangen en we
                        zijn je deelname aan het overwegen. Je krijgt hier zo snel als mogelijk
                        bevestiging over. Stuur ons gerust een e-mailtje als je verdere vragen hebt
                        over je aanmelding.
                    </Fragment>
                );

                break;

            case 'Rejected':
                className = classes.containerRejected;
                icon = <ThumbDownIcon style={{ color: red[800] }} fontSize="inherit" />;
                title = <>Helaas is je deelname <b>afgewezen</b>.</>;
                explanation = (
                    <Fragment>
                        We hebben je geen plaats aan kunnen bieden binnen het team voor
                        <strong> {event.name}</strong>. Je hebt via e-mail een bericht ontvangen met
                        verdere uitleg.
                    </Fragment>
                );
                break;

            default:
                className = classes.containerAccepted;
                icon = <ThumbUpIcon style={{ color: lightGreen[900] }} fontSize="inherit" />;
                title = <>Je deelname is <b>bevestigd</b> ({eventRole}).</>;
                explanation = (
                    <Fragment>
                        We zijn ongelooflijk blij met je aanmelding en je deelname aan het team is
                        hierbij bevestigd. Je hebt via e-mail een bericht ontvangen met verdere
                        uitleg.
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
