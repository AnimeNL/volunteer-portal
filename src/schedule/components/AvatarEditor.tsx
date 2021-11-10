// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { h } from 'preact';
import { createRef, useState } from 'preact/compat';

import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import LoadingButton from '@mui/lab/LoadingButton';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import Stack from '@mui/material/Stack';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import { styled } from '@mui/material/styles';

import ReactAvatarEditor from 'react-avatar-editor';

// Mime type of the image that should be uploaded.
const kAvatarType = 'image/png';

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
    requestClose: () => void;

    // Callback that should be called when the editor is requesting an upload.
    requestUpload: (avatar: Blob) => Promise<boolean>;
}

// The <AvatarEditor> component allows user avatars to be selected, changed and amended based on
// images available on the local device. The resulting image can be shared with the server, to make
// sure that the updated information is visible to all other users as well.
export function AvatarEditor(props: AvatarEditorProps) {
    const { open, src, requestClose, requestUpload } = props;

    // Reference to the editor that's being used for the avatar. May be NULL.
    const editorRef = createRef<ReactAvatarEditor>();

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

    // Called when the upload button has been selected. This is an asynchronous function. A spinner
    // will be shown on the upload button while the operation is in progress.
    const [ uploadError, setUploadError ] = useState(false);
    const [ uploading, setUploading ] = useState(false);

    async function processUpload() {
        // Note that the conditions are defensive: the reference should always be set by React, a
        // scaled canvas should always be obtainable. The inner case handles the actual file upload,
        // where additional safety mitigations are in place.
        if (editorRef.current) {
            const canvas = editorRef.current.getImageScaledToCanvas();
            if (canvas) {
                setUploadError(false);
                setUploading(true);

                try {
                    canvas.toBlob(function (blob) {
                        if (!blob) {
                            setUploading(false);
                            return;
                        }

                        // We were able to obtain a Blob, request for it to be uploaded.
                        requestUpload(blob).then(success => {
                            setUploadError(!success);
                            setUploading(false);

                            handleDialogClose();
                        });

                    }, kAvatarType);
                } catch (e) {
                    console.error(e);

                    // Exceptions usually imply that the <canvas> element was tainted, which is
                    // possible in the local debuggin environment.
                    setUploadError(true);
                    setUploading(false);
                }

                return;
            }
        }

        // The impossible happened. Weeh. Better have some UX.
        setUploadError(true);
    }

    // Handles closing the dialog. We block the request if an avatar upload is in progress. When
    // it's not, state will be reset as error states may not be relevant next time.
    function handleDialogClose() {
        if (uploading)
            return;

        requestClose();

        setUploadError(false);
        setSelectedImage(null);
        setZoomLevel(1);
    }

    return (
        <Dialog onClose={handleDialogClose} open={!!open}>

            <DialogTitle>Upload a new avatar</DialogTitle>
            <DialogContent dividers sx={{ padding: 0, paddingTop: 2, paddingBottom: 1 }}>
                <ReactAvatarEditor width={250} height={250} scale={zoomLevel}
                                   border={[ 32, 0 ]} borderRadius={125}
                                   color={[ 255, 255, 255, .75 ]}
                                   image={image}
                                   /** @ts-ignore */
                                   ref={editorRef} />

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
            <DialogActions sx={{ padding: 2, paddingRight: 4 }}>
                <LoadingButton variant="contained"
                               color={ uploadError ? "error" : "primary" }
                               loading={uploading}
                               loadingPosition="start"
                               startIcon={ <CloudUploadIcon /> }
                               onClick={processUpload}>
                    Upload
                </LoadingButton>
            </DialogActions>

        </Dialog>
    );
}
