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
    'When you’re wondering why the frisbee keeps getting bigger, be careful: it might hit you.',
    'When life gives you melons, you might be dyslexic.',
    'Never put off till tomorrow what you can do the day after tomorrow just as well.',
    'The secret of staying young is to live honestly, eat slowly, and lie about your age.',
    'Don’t watch your back, you might strain your back.',
    'You can learn to be confident.',
    'Are you searching for something? Try looking where you lost it.',
    'Are you out of money? There’s more in an ATM.',
    'Are you searching for a refreshing idea? Try a new deodorant.',
    'You’ll become a winner the moment you stop losing.',
    'Don’t let anyone tell you that they know better than you do.',
    'Don’t accept advice from other people, make your own choices.',
    'Don’t fear a warm toilet seat: it can be comfortable, unless it’s wet.',
    'It’s best to think of bacon as a spice, that way vegan people can enjoy it.',
    'Do you have to share some bad news? Put it in a fortune cookie.',
    'Be careful when telling someone to be themselves, it might be pretty mean.',
    'Many people say that money talks, but sometimes it just says goodbye.',
    'The problem with kleptomaniacs is that they always take things literally.',
    'The easiest time to add insult to injury is when you’re signing someone’s cast.',
    'People who use selfie sticks really need to have a good, long look at themselves.',
    'Always borrow money from a pessimist. They’ll never expect it back.',
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
