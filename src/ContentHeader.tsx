// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { h } from 'preact';

import Chip from '@material-ui/core/Chip';
import FaceIcon from '@material-ui/icons/Face';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';

// CSS customizations applied to the <ContentHeader> component.
const useStyles = makeStyles(theme => ({
    header: {
        backgroundColor: theme.palette.background.contentHeader,
        color: theme.palette.getContrastText(theme.palette.background.contentHeader!),
        display: 'flex',

        borderTopLeftRadius: theme.shape.borderRadius,
        borderTopRightRadius: theme.shape.borderRadius,

        margin: '0px',
        padding: theme.spacing(1, 2),
    },
    loginLabel: { paddingRight: '0 !important' },
    login: { backgroundColor: '#6D4C41 !important' },
    text: {
        flex: 1,
        paddingRight: theme.spacing(2),
    }
}));

// Properties accepted by the <ContentHeader> component.
export interface ContentHeaderProps {
    // Title of the content, to display prominently in the component.
    title: string;
}

// The <ContentHeader> component, which is the canonical header element for <ContentLayout>-based
// pages. It accepts properties to manipulate content shown within the header.
export function ContentHeader(props: ContentHeaderProps) {
    const classes = useStyles();
    const { title } = props;

    return (
        <div className={classes.header}>
            <Typography className={classes.text} variant="h5" component="h1" noWrap>
                {title}
            </Typography>
            <Chip className={classes.login}
                  classes={{ label: classes.loginLabel }}
                  clickable
                  color="secondary"
                  /// @ts-ignore
                  icon={ <FaceIcon /> } />
        </div>
    );
}
