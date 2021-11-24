// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { Component, h } from 'preact';
import { useContext } from 'preact/hooks';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Collapse from '@mui/material/Collapse';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import LoginIcon from '@mui/icons-material/Login';
import { SxProps, Theme } from '@mui/system';
import TextField from '@mui/material/TextField';

import { AppContext } from './AppContext';
import { Link } from './Link';

// CSS customizations applied to the <UserLoginDialog> component.
const kStyles: { [key: string]: SxProps<Theme> } = {
    buttons: {
        paddingTop: 0,
        paddingRight: 3,
        paddingBottom: 2,
        paddingLeft: 0,
    },
    loginButtonProgress: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginTop: '-12px',
        marginLeft: '-12px',
    },
    loginButtonWrapper: {
        marginLeft: 2,
        position: 'relative',
    },
};

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

        const handleClose = () => {
            this.setState(kDefaultState);
            onClose();
        };

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

            const success = await user.authenticate({ emailAddress, accessCode });
            if (success)
                handleClose();
            else
                this.setState({ authenticating: false, authenticationError: true });
        }

        return (
            <Dialog open={open} onClose={handleClose}>
                <DialogTitle>Sign in</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Sign in with your access code to immediately access the status of your
                        application, as well as your personal event schedule.
                    </DialogContentText>
                    <Collapse in={this.state.authenticationError}>
                        <DialogContentText sx={{ paddingY: 1 }} color="error">
                            Sorry, that access code isn't right. We can help you to recover your
                            access code if you send a quick message to <Link href={environment.contactTarget}>{environment.contactName}</Link>.
                        </DialogContentText>
                    </Collapse>
                    <TextField fullWidth
                               sx={{ marginY: 1 }}
                               inputProps={{ inputMode: 'email' }}
                               onBlur={UserLoginDialog.prototype.onBlurEmailAddress.bind(this)}
                               onChange={UserLoginDialog.prototype.onChangeEmailAddress.bind(this)}
                               label="E-mail address"
                               value={this.state.emailAddress}
                               error={this.state.emailAddressError}
                               helperText={this.state.emailAddressError ? 'Invalid address' : ''}
                               required />
                    <TextField fullWidth
                               sx={{ marginY: 1 }}
                               inputProps={{ inputMode: 'numeric' }}
                               onBlur={UserLoginDialog.prototype.onBlurAccessCode.bind(this)}
                               onChange={UserLoginDialog.prototype.onChangeAccessCode.bind(this)}
                               label="Access code"
                               value={this.state.accessCode}
                               error={this.state.accessCodeError}
                               helperText={this.state.accessCodeError ? 'Invalid access code' : ''}
                               required />
                </DialogContent>
                <DialogActions sx={kStyles.buttons}>
                    <Button onClick={handleClose}>Close</Button>
                    <Box sx={kStyles.loginButtonWrapper}>
                        <Button disabled={this.state.authenticating}
                                endIcon={ <LoginIcon /> }
                                onClick={handleLogin}
                                variant="contained">Sign in</Button>
                        { this.state.authenticating &&
                            <CircularProgress sx={kStyles.loginButtonProgress} size={24} /> }
                    </Box>
                </DialogActions>
            </Dialog>
        );
    }
}
