// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { h } from 'preact';

import Typography from '@mui/material/Typography';

// Properties supported by the <SubTitle> component.
export interface SubTitleProps {
    children: React.ReactNode;
}

// The <SubTitle> component can be used to introduce the contents of the following <Paper> component
// with an appropriate level of padding, margin and colouring.
export function SubTitle(props: SubTitleProps) {
    return (
        <Typography paragraph variant="button" color="primary"
                    sx={{ m: 1, marginTop: { xs: 1.5, lg: 2 } }}>
            {props.children}
        </Typography>
    );
}
