// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { ComponentChildren, h } from 'preact';
import { useContext } from 'preact/hooks';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import { SxProps, Theme } from '@mui/system';
import Typography from '@mui/material/Typography';
import { makeStyles } from '@mui/material/styles';

import { AppContext } from './AppContext';
import { ContentTheme } from './ContentTheme';
import { Link } from './Link';

// CSS customizations applied to the <ContentLayout> component. The page will have a background
// image that depends on the device's form factor, with centered contents.
const kStyles: { [key: string]: SxProps<Theme> } = {
    background: {
        position: 'fixed',
        zIndex: -1,

        width: '100vw',
        height: '100vh',

        backgroundAttachment: 'fixed',
        backgroundPosition: 'bottom right',
        backgroundSize: 'cover',
/**
        [theme.breakpoints.down('sm')]: {
            backgroundImage: 'url(/images/background-mobile.jpg)',
        },

        [theme.breakpoints.up('sm')]: {
            backgroundImage: 'url(/images/background-desktop.jpg)',
        },
**/
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
    },

    logo: {  // TODO: fix
        marginTop: '2em',
        maxWidth: '40vw',
        width: '256px',
    }
};

// Properties accepted by the <ContentLayout> component.
interface ContentLayoutProps {
    children: ComponentChildren;
}

// The <ContentLayout> component is a full-page component that draws the canonical background, logo
// and manages positioning for arbitrary page content. No header or actual content will be drawn,
// which should be included as the children of this component.
export function ContentLayout(props: ContentLayoutProps) {
    const { environment } = useContext(AppContext);
    const year = (new Date()).getFullYear();

    return (
        <ContentTheme>
            <Box sx={kStyles.background}></Box>
            <Box sx={kStyles.container}>
                <Link href="/">
                    <img src="/images/logo-portal.png" alt="J-POP Logo" />
                </Link>
                <Paper sx={kStyles.content}>
                    {props.children}
                </Paper>
                <Typography variant="body2" sx={kStyles.footer}>
                    {environment.title} (
                    <Link variant="inherit" href="https://github.com/AnimeNL/volunteer-portal">
                        {process.env.REACT_APP_GIT_VERSION}
                    </Link>) — © 2015–{year}
                </Typography>
            </Box>
        </ContentTheme>
    );
}
