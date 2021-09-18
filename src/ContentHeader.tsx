// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { Fragment, h } from 'preact';
import { useContext, useState } from 'preact/hooks';

import Avatar from '@mui/material/Avatar';
import FaceIcon from '@mui/icons-material/Face';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import { makeStyles } from '@mui/material/styles';

import { AppContext } from './AppContext';
import { ContentHeaderChip } from './ContentHeaderChip';
import { UserLoginDialog } from './UserLoginDialog';
import { firstName, initial } from './base/NameUtilities';

// CSS customizations applied to the <ContentHeader> component.
const useStyles = makeStyles(theme => ({
    avatar: {
        backgroundColor: theme.palette.primary.light,
        color: `${theme.palette.getContrastText(theme.palette.primary.light)} !important`,
    },
    header: {
        backgroundColor: theme.palette.primary.dark,
        color: theme.palette.getContrastText(theme.palette.primary.dark),
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
}));

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

    const classes = useStyles();
    return (
        <div className={classes.header}>
            <Typography className={classes.text} variant="h5" component="h1" noWrap>
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
                                       avatar={ <Avatar className={classes.avatar} src={user.avatar}>
                                                    {initial(user.name)}
                                                </Avatar> }
                                       label={firstName(user.name)}
                                       onClick={openUserMenu} />

                    <Menu anchorEl={userMenuAnchor}
                          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                          transformOrigin={{ vertical: 'top', horizontal: 'center' }}
                          getContentAnchorEl={null}
                          onClose={() => setUserMenuOpen(false)}
                          open={userMenuOpen}>

                        <MenuItem onClick={signOut}>Sign out</MenuItem>

                    </Menu>

                </Fragment> }
        </div>
    );
}
