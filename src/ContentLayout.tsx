// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { ComponentChildren, Fragment, h } from 'preact';

import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';

import { AppContext } from './AppContext';
import { useContext } from 'preact/hooks';

// CSS customizations applied to the <ContentLayout> component. The page will have a background
// image that depends on the device's form factor, with centered contents.
const useStyles = makeStyles(theme => ({
    background: {
        position: 'fixed',
        zIndex: -1,

        width: '100vw',
        height: '100vh',

        backgroundAttachment: 'fixed',
        backgroundPosition: 'bottom right',
        backgroundSize: 'cover',

        [theme.breakpoints.down('xs')]: {
            backgroundImage: 'url(/images/background-mobile.jpg)',
        },

        [theme.breakpoints.up('sm')]: {
            backgroundImage: 'url(/images/background-desktop.jpg)',
        },
    },

    container: {
        display: 'flex',

        alignItems: 'center',
        flexDirection: 'column',
        justifyContent: 'top',
    },

    content: {
        margin: '2em 0 1em 0',

        maxWidth: '1280px',
        width: '90%',
    },

    footer: {
        paddingBottom: '125px',

        '& a': {
            color: '#4e342e',
        }
    },

    logo: {
        marginTop: '2em',
        maxWidth: '40vw',
        width: '256px',
    }
}));

// Properties accepted by the <ContentLayout> component.
interface ContentLayoutProps {
    children: ComponentChildren;
}

// The <ContentLayout> component is a full-page component that draws the canonical background, logo
// and manages positioning for arbitrary page content. No header or actual content will be drawn,
// which should be included as the children of this component.
export function ContentLayout(props: ContentLayoutProps) {
    const classes = useStyles();
    const { environment } = useContext(AppContext);
    const year = (new Date()).getFullYear();

    return (
        <Fragment>
            <div className={classes.background}></div>
            <div className={classes.container}>
                <img className={classes.logo} src="/images/logo-portal.png" alt="J-POP Logo" />
                <Paper className={classes.content}>
                    {props.children}
                </Paper>
                <Typography variant="body2" className={classes.footer}>
                    {environment.title} (
                    <a href="https://github.com/AnimeNL/volunteer-portal">
                        {process.env.REACT_APP_GIT_VERSION}
                    </a>) — © 2015–{year}
                </Typography>
            </div>
        </Fragment>
    );
}
