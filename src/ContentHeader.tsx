// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { Fragment, h } from 'preact';
import { useContext, useState } from 'preact/hooks';

import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import FaceIcon from '@mui/icons-material/Face';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { SxProps, Theme } from '@mui/system';
import Typography from '@mui/material/Typography';

import { AppContext } from './AppContext';
import { ContentHeaderChip } from './ContentHeaderChip';
import { UserLoginDialog } from './UserLoginDialog';
import { firstName, initial } from './base/NameUtilities';

// CSS customizations applied to the <ContentHeader> component.
const kStyles: { [key: string]: SxProps<Theme> } = {
    avatar: {
        backgroundColor: 'primary.light',
        color: theme => theme.palette.getContrastText(theme.palette.primary.light),
    },
    header: {
        backgroundColor: 'primary.dark',
        color: theme => theme.palette.getContrastText(theme.palette.primary.dark),
        display: 'flex',

        borderTopLeftRadius: 4,
        borderTopRightRadius: 4,

        margin: 0,
        paddingX: 2,
        paddingY: 1,
    },
    text: {
        flex: 1,
        paddingRight: 2,
    },
};

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
    const { personalize, title } = props;
    const { user } = useContext(AppContext);

    const [ authenticationDialogOpen, setAuthenticationDialogOpen ] = useState(false);

    const [ userMenuAnchor, setUserMenuAnchor ] = useState<any>(null);
    const [ userMenuOpen, setUserMenuOpen ] = useState(false);

    function openUserMenu(event: React.MouseEvent<HTMLDivElement>) {
        setUserMenuAnchor(event.currentTarget);
        setUserMenuOpen(true);
    }

    function signOut() {
        setUserMenuOpen(false);
        return user.signOut();
    }

    return (
        <Box sx={kStyles.header}>
            <Typography sx={kStyles.text} variant="h5" component="h1" noWrap>
                {title}
            </Typography>

           { (personalize && !user.authenticated) &&
                <Fragment>

                    <ContentHeaderChip clickable
                                       /// @ts-ignore
                                       icon={ <FaceIcon /> }
                                       label="Sign in"
                                       onClick={() => setAuthenticationDialogOpen(true)} />

                    <UserLoginDialog onClose={() => setAuthenticationDialogOpen(false)}
                                     open={authenticationDialogOpen} />

                </Fragment> }

            { (personalize && user.authenticated) &&
                <Fragment>

                    <ContentHeaderChip clickable
                                       /// @ts-ignore
                                       avatar={ <Avatar sx={kStyles.avatar} src={user.avatar}>
                                                    {initial(user.name)}
                                                </Avatar> }
                                       label={firstName(user.name)}
                                       onClick={openUserMenu} />

                    <Menu anchorEl={userMenuAnchor}
                          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                          transformOrigin={{ vertical: 'top', horizontal: 'center' }}
                          /* getContentAnchorEl={null} */
                          onClose={() => setUserMenuOpen(false)}
                          open={userMenuOpen}>

                        <MenuItem onClick={signOut}>Sign out</MenuItem>

                    </Menu>

                </Fragment> }
        </Box>
    );
}
