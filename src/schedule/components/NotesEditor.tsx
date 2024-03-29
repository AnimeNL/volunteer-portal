// Copyright 2022 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { h } from 'preact';
import { useEffect, useRef, useState } from 'preact/compat';

import Collapse from '@mui/material/Collapse';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import LoadingButton from '@mui/lab/LoadingButton';
import TextField from '@mui/material/TextField';

import { DarkModeCapableAlert } from './DarkModeCapableAlert';

function usePrevious<T>(value?: T): T | undefined {
    const reference = useRef<T>();
    useEffect(() => {
        reference.current = value;
    });

    return reference.current;
}

// Properties accepted by the <NotesEditor> component.
export interface NotesEditorProps {
    // Whether the dialog should be visible and opened.
    open?: boolean;

    // Existing contents of the note as it should be edited by the user. Contains markdown, which
    // will be rendered as plaintext to allow full editing.
    notes?: string;

    // Callback that should be called when the editor is being closed.
    requestClose: () => void;

    // Callback that should be called when the editor is requesting a save. An error message is
    // required to be given when the request was unsuccessful.
    requestSave: (notes: string) => Promise<true | { error: string }>;
}

// The notes editor allows privileged users to amend the notes for events, volunteers and other
// entities within the volunteer portal. There are no restrictions to content and full Markdown can
// be used. Storing an updated note is an asynchronous process.
export function NotesEditor(props: NotesEditorProps) {
    const { open, requestClose, requestSave } = props;

    // The latest notes are stored as state, enabling easy access.
    const [ currentNotes, setCurrentNotes ] = useState(props.notes);

    function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
        setCurrentNotes(event.target.value);
    }

    // Called when the Save button has been clicked. This is an asynchronous process as the new
    // contents have to be sent to the server, and stored in a database there. Errors can occur, as
    // this functionality relies on having an active and working internet connection.
    const [ saveError, setSaveError ] = useState<string>();
    const [ saving, setSaving ] = useState(false);

    async function processSave() {
        setSaveError(undefined);
        setSaving(true);

        const result = await requestSave(currentNotes || '');
        setSaving(false);

        if (result !== true)
            setSaveError(result.error);
        else
            requestClose();
    }

    // Processes a click on the "clear" button. We only clear the text field's contents, but don't
    // initiate the save in case this was an accidental misclick.
    function processClear() {
        setCurrentNotes(/* empty notes= */ '');
    }

    // Handles closing the dialog, which we block when a save is in progress to avoid losing data
    // or aborting the operation by accident. The user might've just written a poem.
    function handleDialogClose() {
        if (saving)
            return;

        requestClose();
        setSaveError(undefined);
    }

    // Handles resetting the dialog's state when it's being re-opened. This is necessary because
    // the current notes value is stored in a state, that may or may not be re-used when the dialog
    // is reopened with exactly the same |props| values. (I.e. the reopen-after-dismiss case.)
    const previousOpen = usePrevious(open);
    useEffect(() => {
        if (!open || previousOpen)
            return;  // not the state we care about

        setCurrentNotes(props.notes ?? '');
        setSaveError(undefined);

    }, [ open, previousOpen ]);

    return (
        <Dialog onClose={handleDialogClose} open={!!open}>
            <DialogTitle>Update notes</DialogTitle>
            <DialogContent sx={{ pb: 1 }}>
                <DialogContentText>
                    The notes may contain Markdown formatting. Saved notes will immediately become
                    available to other volunteers.
                </DialogContentText>
                <TextField fullWidth
                           maxRows={8}
                           multiline
                           sx={{ pt: 2 }}
                           placeholder="Notes…"
                           onChange={handleChange}
                           value={currentNotes} />

                <Collapse in={!!saveError}>
                    <DarkModeCapableAlert severity="error" sx={{ mt: 2 }}>
                        {saveError}
                    </DarkModeCapableAlert>
                </Collapse>

            </DialogContent>
            <DialogActions sx={{ paddingBottom: 2, paddingRight: 3 }}>
                <LoadingButton variant="text"
                               loading={saving}
                               loadingPosition="center"
                               onClick={processClear}>
                    Clear
                </LoadingButton>

                <LoadingButton variant="contained"
                               color={ !!saveError ? "error" : "primary" }
                               loading={saving}
                               loadingPosition="start"
                               startIcon={ <CloudUploadIcon /> }
                               onClick={processSave}>
                    Save
                </LoadingButton>
            </DialogActions>
        </Dialog>
    );
}
