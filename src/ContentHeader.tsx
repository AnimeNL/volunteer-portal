// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { ComponentChildren, h } from 'preact';

import { makeStyles } from '@material-ui/core/styles';

// CSS customizations applied to the <ContentHeader> component.
const useStyles = makeStyles(theme => ({
    header: {
        backgroundColor: theme.palette.background.contentHeader,
        color: theme.palette.getContrastText(theme.palette.background.contentHeader!),

        borderTopLeftRadius: theme.shape.borderRadius,
        borderTopRightRadius: theme.shape.borderRadius,

        margin: '0px',
        padding: theme.spacing(1, 2),

        fontSize: theme.typography.h5.fontSize,
        fontWeight: 'normal',
    }
}));

// Properties accepted by the <ContentHeader> component.
export interface ContentHeaderProps {
    children: ComponentChildren;
}

// The <ContentHeader> component, which is the canonical header element for <ContentLayout>-based
// pages. It accepts properties to manipulate content shown within the header.
export function ContentHeader(props: ContentHeaderProps) {
    const classes = useStyles();

    return (
        <h1 className={classes.header}>
            {props.children}
        </h1>
    );
}
