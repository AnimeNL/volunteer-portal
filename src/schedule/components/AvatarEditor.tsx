// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { h } from 'preact';
import { useState } from 'preact/compat';

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
import { styled } from '@mui/material/styles';

import ReactAvatarEditor from 'react-avatar-editor';

// The default avatar that should be shown if none is available for the user.
const kDefaultAvatar = '/images/avatar-none.jpg';

// Invisible input element, used to have an icon instead of a file upload bar.
const InvisibleInput = styled('input')({
    display: 'none',
});

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

    // The image that has been selected by the file upload component.
    const [ selectedImage, setSelectedImage ] = useState<File | null>(null);

    function onSelectedImageChange(event: React.ChangeEvent<HTMLInputElement>) {
        if (event.currentTarget && event.currentTarget.files?.length)
            setSelectedImage(event.currentTarget.files[0]);
        else
            setSelectedImage(null);
    }

    // Zoom level for the image selected in the react-avatar-editor component.
    const [ zoomLevel, setZoomLevel ] = useState(1);

    // Helper functions to increase or decrease the zoom level of the selected avatar.
    function decreaseZoomLevel() { setZoomLevel(Math.max(1, zoomLevel / 1.2)); }
    function increaseZoomLevel() { setZoomLevel(Math.min(zoomLevel * 1.2, 5)); }

    // The image that should be shown. A manually selected image takes priority, then the image
    // with which this editor was opened, falling back to the default avatar if none was available.
    const image = selectedImage ?? src ?? kDefaultAvatar;

    // TODO: Support returning the selected image on upload.

    return (
        <Dialog onClose={e => onClose()}
                open={!!open}>

            <DialogTitle>Upload a new avatar</DialogTitle>
            <DialogContent dividers sx={{ padding: 0, paddingTop: 2, paddingBottom: 1 }}>
                <ReactAvatarEditor width={250} height={250} scale={zoomLevel}
                                   border={[ 32, 0 ]} borderRadius={125}
                                   color={[ 255, 255, 255, .75 ]}
                                   image={image} />

                <Stack direction="row"
                       justifyContent="center">
                    <label htmlFor="avatar-editor-file">
                        <InvisibleInput type="file" accept="image/*"
                                        onChange={onSelectedImageChange}
                                        id="avatar-editor-file" />

                        <IconButton component="span">
                            <PhotoCameraIcon />
                        </IconButton>
                    </label>
                    <IconButton onClick={increaseZoomLevel} sx={{ marginLeft: 6 }}>
                        <ZoomInIcon />
                    </IconButton>
                    <IconButton onClick={decreaseZoomLevel}>
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
