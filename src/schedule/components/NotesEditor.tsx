// Copyright 2022 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { h } from 'preact';
import { useState } from 'preact/compat';

import Alert from '@mui/material/Alert';
import Collapse from '@mui/material/Collapse';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import LoadingButton from '@mui/lab/LoadingButton';
import TextField from '@mui/material/TextField';

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
    const { open, notes, requestClose, requestSave } = props;

    // The latest notes are stored as state, enabling easy access.
    const [ currentNotes, setCurrentNotes ] = useState(notes);

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

    // Handles closing the dialog, which we block when a save is in progress to avoid losing data
    // or aborting the operation by accident. The user might've just written a poem.
    function handleDialogClose() {
        if (saving)
            return;

        requestClose();
        setSaveError(undefined);
    }

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
                    <Alert severity="error" sx={{ mt: 2 }}>
                        {saveError}
                    </Alert>
                </Collapse>

            </DialogContent>
            <DialogActions sx={{ paddingBottom: 2, paddingRight: 3 }}>
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
