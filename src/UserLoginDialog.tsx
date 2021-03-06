// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { Component, h } from 'preact';
import { useContext } from 'preact/hooks';

import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import Collapse from '@material-ui/core/Collapse';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import LoginIcon from '@material-ui/icons/Login';
import TextField from '@material-ui/core/TextField';
import { makeStyles } from '@material-ui/core/styles';

import { AppContext } from './AppContext';
import { Link } from './Link';

// CSS customizations applied to the <UserLoginDialog> component.
const useStyles = makeStyles(theme => ({
    buttons: {
        padding: theme.spacing(0, 3, 2, 0),
    },
    formField: {
        margin: theme.spacing(1, 0),
    },
    loginButtonProgress: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginTop: -12,
        marginLeft: -12,
    },
    loginButtonWrapper: {
        marginLeft: theme.spacing(2),
        position: 'relative',
    }
}));

// Properties accepted by the <UserLoginDialog> component.
export interface UserLoginDialogProps {
    // Callback that will be invoked when the login dialog is to be closed.
    onClose: () => void;

    // Whether the dialog should be opened.
    open: boolean;
}

// State the <UserLoginDialog> component can be in. Managed through Preact's state propagation.
interface UserLoginDialogState {
    // The access code currently visible in the form.
    accessCode: string;

    // Whether there is an issue with the access code currently entered.
    accessCodeError: boolean;

    // Whether an authentication attempt is currently being processed.
    authenticating: boolean;

    // Whether an error occured in the most recent authentication attempt.
    authenticationError: boolean;

    // The e-mail address currently visible in the form.
    emailAddress: string;

    // Whether there is an issue with the e-mail address currently entered.
    emailAddressError: boolean;
}

// Default state with which the dialog will be initialized.
const kDefaultState: UserLoginDialogState = {
    accessCode: '',
    accessCodeError: false,
    authenticating: false,
    authenticationError: false,
    emailAddress: '',
    emailAddressError: false,
};

// Regular expression to validate access codes. We only assume that it's a number of at least four
// digits, as anything below that would be.. well, marginally less secure still.
const kAccessCodeExpression = /^[0-9]{4,}$/;

// Regular expression to validate e-mail addresses. Generally you don't want to do this.
const kValidateEmailAddressExpression =
    /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// Dialog that enables the user to sign in to their account. Accounts are shared across events, and
// contain the necessary information to detail which events they have access to as a volunteer.
export class UserLoginDialog extends Component<UserLoginDialogProps, UserLoginDialogState> {
    public state: UserLoginDialogState = kDefaultState;

    onBlurAccessCode(event: React.FocusEvent<HTMLInputElement>) {
        this.setState({
            authenticationError: false,
            accessCodeError: !kAccessCodeExpression.test(event.target.value)
        });
    }

    onBlurEmailAddress(event: React.FocusEvent<HTMLInputElement>) {
        this.setState({
            authenticationError: false,
            emailAddressError: !kValidateEmailAddressExpression.test(event.target.value)
        });
    }

    onChangeAccessCode(event: React.ChangeEvent<HTMLInputElement>) {
        this.setState({ accessCode: event.target.value });
    }

    onChangeEmailAddress(event: React.ChangeEvent<HTMLInputElement>) {
        this.setState({ emailAddress: event.target.value });
    }

    render(props: UserLoginDialogProps) {
        const { onClose, open } = props;
        const { environment, user } = useContext(AppContext);

        const handleLogin = async() => {
            const { emailAddress, accessCode } = this.state;

            this.setState({ authenticationError: false });

            if (!kValidateEmailAddressExpression.test(emailAddress)) {
                this.setState({ emailAddressError: true });
                return;
            }

            if (!kAccessCodeExpression.test(accessCode)) {
                this.setState({ accessCodeError: true });
                return;
            }

            this.setState({ authenticating: true });

            const success = await user.authenticate(emailAddress, accessCode);
            if (success) {
                this.setState({ authenticating: false, authenticationError: false });
                onClose();

            } else {
                this.setState({ authenticating: false, authenticationError: true });
            }
        }

        const classes = useStyles();
        return (
            <Dialog open={open} onClose={onClose}>
                <DialogTitle>Sign in to your account</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Sign in to your volunteer account to instantly see your registration status and
                        access your schedule.
                    </DialogContentText>
                    <Collapse in={this.state.authenticationError}>
                        <DialogContentText color="error">
                            The e-mail address and access code you entered did not match our records.
                            Reach out to <Link href={environment.contactTarget}>{environment.contactName}</Link> if
                            you lost your details.
                        </DialogContentText>
                    </Collapse>
                    <TextField fullWidth
                               className={classes.formField}
                               inputProps={{ inputMode: 'email' }}
                               onBlur={UserLoginDialog.prototype.onBlurEmailAddress.bind(this)}
                               onChange={UserLoginDialog.prototype.onChangeEmailAddress.bind(this)}
                               label="E-mail address"
                               value={this.state.emailAddress}
                               error={this.state.emailAddressError}
                               helperText={this.state.emailAddressError ? 'Invalid address' : ''}
                               required />
                    <TextField fullWidth
                               className={classes.formField}
                               inputProps={{ inputMode: 'numeric' }}
                               onBlur={UserLoginDialog.prototype.onBlurAccessCode.bind(this)}
                               onChange={UserLoginDialog.prototype.onChangeAccessCode.bind(this)}
                               label="Access code"
                               value={this.state.accessCode}
                               error={this.state.accessCodeError}
                               helperText={this.state.accessCodeError ? 'Invalid access code' : ''}
                               required />
                </DialogContent>
                <DialogActions className={classes.buttons}>
                    <Button onClick={onClose}>Close</Button>
                    <div className={classes.loginButtonWrapper}>
                        <Button disabled={this.state.authenticating}
                                endIcon={ <LoginIcon /> }
                                onClick={handleLogin}
                                variant="contained">Login</Button>
                        { this.state.authenticating &&
                            <CircularProgress className={classes.loginButtonProgress} size={24} /> }
                    </div>
                </DialogActions>
            </Dialog>
        );
    }
}
