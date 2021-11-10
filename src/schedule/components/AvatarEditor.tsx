// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { h } from 'preact';
import { lazy } from 'preact/compat';

import Button from '@mui/material/Button';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import Stack from '@mui/material/Stack';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';

import ReactAvatarEditor from 'react-avatar-editor';

// The default avatar that should be shown if none is available for the user.
const kDefaultAvatar = '/images/avatar-none.jpg';

// Properties accepted by the <AvatarEditor> component.
export interface AvatarEditorProps {
    // Whether the dialog should be visible and opened.
    open?: boolean;

    // Source URL of the image that should be loaded as the default avatar.
    src?: string;

    // Callback that should be called when the editor is being closed.
    onClose: () => void;
}

// The <AvatarEditor> component allows user avatars to be selected, changed and amended based on
// images available on the local device. The resulting image can be shared with the server, to make
// sure that the updated information is visible to all other users as well.
export function AvatarEditor(props: AvatarEditorProps) {
    const { open, src, onClose } = props;

    // TODO: Support selecting a new file for upload.
    // TODO: Support zooming the selected image in and out.
    // TODO: Support returning the selected image on upload.

    return (
        <Dialog onClose={e => onClose()}
                open={!!open}>

            <DialogTitle>Upload a new avatar</DialogTitle>
            <DialogContent dividers sx={{ padding: 0, paddingTop: 2, paddingBottom: 1 }}>
                <ReactAvatarEditor width={250} height={250}
                                   border={[ 32, 0 ]} borderRadius={125}
                                   color={[ 255, 255, 255, .75 ]}
                                   image={src ?? kDefaultAvatar} />

                <Stack direction="row"
                       justifyContent="center">
                    <IconButton sx={{ marginRight: 6 }}>
                        <PhotoCameraIcon />
                    </IconButton>
                    <IconButton>
                        <ZoomInIcon />
                    </IconButton>
                    <IconButton>
                        <ZoomOutIcon />
                    </IconButton>
                </Stack>
            </DialogContent>
            <DialogActions sx={{ padding: 2 }}>
                <Button variant="contained">
                    Upload
                </Button>
            </DialogActions>

        </Dialog>
    );
}
