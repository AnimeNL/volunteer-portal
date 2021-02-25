// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { Fragment, h } from 'preact';
import { useState } from 'preact/hooks';

import Alert from '@material-ui/lab/Alert';
import CloseIcon from '@material-ui/icons/Close';
import IconButton from '@material-ui/core/IconButton';
import Snackbar from '@material-ui/core/Snackbar';

// Properties accepted by the <AppError /> component.
export interface AppErrorProps {
    // The message that should be displayed as the application error.
    error: string;
}

// Component responsible for displaying an application error. These are high priority, urgent
// snackbar alerts displayed in the bottom-left corner of the user's screen, which do not dismiss
// until the user does so manually.
export function AppError(props: AppErrorProps) {
    const [ open, setOpen ] = useState(true);

    function closeSnackbar(event: any, reason?: string) {
        console.log(reason);
        if (reason !== 'clickaway')
            setOpen(false);
    }

    return (
        <Snackbar anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }} open={open}>
            <Alert elevation={6}
                   severity="error"
                   variant="filled"
                   action={
                       <Fragment>
                            <IconButton aria-label="close"
                                        color="inherit"
                                        onClick={closeSnackbar}
                                        size="small">
                                <CloseIcon fontSize="small" />
                            </IconButton>
                       </Fragment>
                   }>
                {props.error}
            </Alert>
        </Snackbar>
    );
}
