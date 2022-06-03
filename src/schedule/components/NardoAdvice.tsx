// Copyright 2022 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { Fragment, h } from 'preact';
import { useState } from 'preact/compat';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CancelIcon from '@mui/icons-material/Cancel';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardMedia from '@mui/material/CardMedia';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import { SxProps, Theme } from '@mui/system';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import Typography from '@mui/material/Typography';
import blueGrey from '@mui/material/colors/blueGrey';

import { ApiRequest } from '../../base/ApiRequest';
import { DateTime } from '../../base/DateTime';
import { User } from '../../base/User';

// Advice that can be given by Nardo.
const kAdvice = [
    'Allergisch voor mensen? Probeer eens met ze te praten.',
    'Als je likt aan een deurklink, dan weet je of de persoon voor je de handen heeft gewassen.',
    'Hondenpoep krijg je los van je schoenzool door ze in de vriezer te zetten.',
    'Zelfvertrouwen kun je leren.',
    'Kijk niet teveel achter je, dat geeft nekklachten.',
    'Er is een causaal verband tussen redenen en gebeurtenissen.',
    'Last van negatieve gedachten? Denk aan Bob Ross die een hertje aait.',
    'Ben je iets kwijt? Probeer eens te zoeken waar je het verloor.',
    'Is je geld op? Haal meer uit een pinautomaat.',
    'Zwem rechtstreeks naar een haai om dominantie te tonen.',
    'Ontspan, maar hou je kringspier gespannen.',
    'Liever poepen in je broek dan doodgaan aan obstipatie.',
    'Ongewenst advies nodig? Del a Rie Advies helpt je iedere dag met deze behoefte.',
    'Je wordt een winnaar zodra je stopt met verliezen.',
    'Last van blaren? Probeer er niet aan te denken.',
    'Als je verdwaald, waar je ook bent, dan ben je daar.',
    'Gaat de deur niet open? Probeer de deurklink.',
    'Zoek je een verfrissend idee? Probeer de douche eens.',
    'Voel je je bekeken? Probeer Bing Search.',
    'Laat niemand je vertellen dat ze het beter weten.',
    'Neem geen advies van mij aan, maak je eigen keuzes.',
    'Wordt niet ziek, dat is slecht voor je gezondheid.',
    'Broekzakken zijn niet alleen decoratief, je kunt er ook spullen in doen.',
    'Als je niemand uitnodigd voor je verjaardag is het minder teleurstellend als er niemand komt.',
    'Vrees een warme toiletbril niet, het voelt best prettig, tenzij hij nat is.',
    'Moet je een moeilijk bericht vertellen? Stop het in een gelukskoekje.',
    'Koeien eten het voedsel van veganisten. Eet een koe, help een veganist.',
    'Leer recyclen door de ideeën van anderen te hergebruiken.',
    'Vegetarische worstjes smaken beter met spek omhuld.',
    'Het voordeel van stilstaan is dat je niet loopt.',
];

// CSS customizations applied to the <NardoAdvice> component.
const kStyles: { [key: string]: SxProps<Theme> } = {
    actionArea: {
        padding: 2,
    },
    box: {
        flexGrow: 1,
        marginTop: -0.5,
    },
    card: {
        marginY: 2,
        backgroundColor: theme => theme.palette.mode === 'light' ? blueGrey[100]
                                                                 : blueGrey[800],
    },
    closeButton: {
        position: 'relative',
        top: { xs: '2px', md: '1px' },
    }
};

// Properties accepted by the <NardoAdvice> card.
export interface NardoAdviceProps {
    /**
     * Date and time at which the education card is being displayed. Used to seed which suggestion
     * should be displayed to the user.
     */
    dateTime: DateTime;

    /**
     * The user for whom the advice is being given.
     */
    user: User;
}

// The <NardoAdvice> card displays a MUI card containing the Del a Rie Advies logo, together with a
// piece of advice intended for the volunteer. A new message will be displayed every minute.
export function NardoAdvice(props: NardoAdviceProps) {
    const advice = kAdvice[Math.floor(props.dateTime.unix() / 60) % kAdvice.length];
    const { user } = props;

    function activateCard() {
        window.open('https://delarieadvies.nl/', '_blank')?.focus();
    }

    const [ adviceRequested, setAdviceRequested ] = useState<boolean>(false);
    const [ dialogOpen, setDialogOpen ] = useState<boolean>(false);

    function activateClose(event: React.MouseEvent<HTMLSpanElement>) {
        if (event.stopPropagation)
            event.stopPropagation();

        if (!adviceRequested) {
            {
                // The request will be issued, but we don't care about either the response or
                // whether it was successful. This is a best effort easter egg feature... at best.
                new ApiRequest('INardo').issue({ authToken: user.authToken });
            }

            setAdviceRequested(true);
        }

        setDialogOpen(true);
    }

    return (
        <Fragment>
            <Card sx={kStyles.card}>
                <CardActionArea onClick={activateCard} sx={kStyles.actionArea}>
                    <Stack divider={ <Divider orientation="vertical" flexItem /> }
                        direction="row" alignItems="center"
                        spacing={2}>

                        <Box sx={kStyles.box}>
                            <Typography variant="overline" gutterBottom onClick={activateClose}>
                                <CancelIcon fontSize="inherit" sx={kStyles.closeButton} /> Advertisement
                            </Typography>
                            <Typography variant="body1">
                                <em>{advice}</em>
                            </Typography>
                        </Box>

                        <CardMedia component="img"
                                sx={{ width: 87, height: 64 }}
                                image="/static/images/advice.png"
                                alt="Del a Rie Advies logo" />

                    </Stack>
                </CardActionArea>
            </Card>
            <Dialog open={dialogOpen}>
                <DialogTitle>
                    Del a Rie Advies
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Our research has shown that closing our advertisement is a sign of
                        frustration and being out of touch with your inner self. A request has been
                        sent to one of our representatives for a consultation.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ paddingBottom: 2, paddingRight: 3, paddingTop: 0 }}>
                    <Button endIcon={ <ThumbUpIcon /> }
                            onClick={ () => setDialogOpen(false) }
                            variant="contained">Thank you</Button>
                </DialogActions>
            </Dialog>
        </Fragment>
    );

}
