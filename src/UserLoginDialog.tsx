// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { h } from 'preact';

import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import LoginIcon from '@material-ui/icons/Login';
import TextField from '@material-ui/core/TextField';
import { makeStyles } from '@material-ui/core/styles';

// CSS customizations applied to the <UserLoginDialog> component.
const useStyles = makeStyles(theme => ({
    buttons: {
        padding: theme.spacing(0, 3, 2, 0),
    },
    formField: {
        margin: theme.spacing(1, 0),
    }
}));

// Properties accepted by the <UserLoginDialog> component.
export interface UserLoginDialogProps {
    // Callback that will be invoked when the login dialog is to be closed.
    onClose: () => void;

    // Whether the dialog should be opened.
    open: boolean;
}

// Dialog that enables the user to sign in to their account. Accounts are shared across events, and
// contain the necessary information to detail which events they have access to as a volunteer.
export function UserLoginDialog(props: UserLoginDialogProps) {
    const { onClose, open } = props;

    const classes = useStyles();
    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Sign in to your account</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Sign in to your volunteer account to instantly see your registration status and
                    access your schedule.
                </DialogContentText>
                <TextField fullWidth
                           className={classes.formField}
                           inputProps={{ inputMode: 'email' }}
                           label="E-mail address"
                           required />
                <TextField fullWidth
                           className={classes.formField}
                           inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                           label="Access code"
                           required />
            </DialogContent>
            <DialogActions className={classes.buttons}>
                <Button onClick={onClose}>Close</Button>
                <Button endIcon={ <LoginIcon /> }
                        onClick={onClose}
                        variant="contained">Login</Button>
            </DialogActions>
        </Dialog>
    );
}
