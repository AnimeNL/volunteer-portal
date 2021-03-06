// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { h } from 'preact';

import FaceIcon from '@material-ui/icons/Face';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';

import { ContentHeaderChip } from './ContentHeaderChip';

// CSS customizations applied to the <ContentHeader> component.
const useStyles = makeStyles(theme => {
    const headerBackground = theme.palette.background.contentHeader!;

    return {
        header: {
            backgroundColor: headerBackground,
            color: theme.palette.getContrastText(headerBackground),
            display: 'flex',

            borderTopLeftRadius: theme.shape.borderRadius,
            borderTopRightRadius: theme.shape.borderRadius,

            margin: '0px',
            padding: theme.spacing(1, 2),
        },
        text: {
            flex: 1,
            paddingRight: theme.spacing(2),
        }
    }
});

// Properties accepted by the <ContentHeader> component.
export interface ContentHeaderProps {
    // Whether the header should be personalized to the person logged in, if any.
    personalize?: boolean;

    // Title of the content, to display prominently in the component.
    title: string;
}

// The <ContentHeader> component, which is the canonical header element for <ContentLayout>-based
// pages. It accepts properties to manipulate content shown within the header.
export function ContentHeader(props: ContentHeaderProps) {
    const classes = useStyles();
    const { personalize, title } = props;

    return (
        <div className={classes.header}>
            <Typography className={classes.text} variant="h5" component="h1" noWrap>
                {title}
            </Typography>
            { personalize &&
                <ContentHeaderChip clickable
                                   /// @ts-ignore
                                   icon={ <FaceIcon /> }
                                   label="Sign in" /> }
        </div>
    );
}
