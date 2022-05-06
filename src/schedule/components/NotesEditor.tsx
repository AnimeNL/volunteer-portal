// Copyright 2022 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { h } from 'preact';
import { useState } from 'preact/compat';

import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import LoadingButton from '@mui/lab/LoadingButton';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import { styled } from '@mui/material/styles';

// Properties accepted by the <NotesEditor> component.
export interface NotesEditorProps {
    // Whether the dialog should be visible and opened.
    open?: boolean;

    // Existing contents of the note as it should be edited by the user. Contains markdown, which
    // will be rendered as plaintext to allow full editing.
    notes?: string;

    // Callback that should be called when the editor is being closed.
    requestClose: () => void;

    // Callback that should be called when the editor is requesting a save.
    requestSave: (notes: string) => Promise<boolean>;
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
    const [ saveError, setSaveError ] = useState(false);
    const [ saving, setSaving ] = useState(false);

    async function processSave() {
        setSaveError(false);
        setSaving(true);

        const success = await requestSave(currentNotes || '');

        setSaveError(!success);
        setSaving(false);

        if (success)
            requestClose();
    }

    // Handles closing the dialog, which we block when a save is in progress to avoid losing data
    // or aborting the operation by accident. The user might've just written a poem.
    function handleDialogClose() {
        if (saving)
            return;

        requestClose();
        setSaveError(false);
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
            </DialogContent>
            <DialogActions sx={{ paddingBottom: 2, paddingRight: 3 }}>
                <LoadingButton variant="contained"
                               color={ saveError ? "error" : "primary" }
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
