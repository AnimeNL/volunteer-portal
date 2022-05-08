// Copyright 2022 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { h } from 'preact';

import CardHeader from '@mui/material/CardHeader';
import { type SxProps, Theme } from '@mui/system';

import { Link } from '../../Link';

// CSS customizations applied to the <LocationHeader> and <LocationHeader> components.
const kStyles: { [key: string]: SxProps<Theme> } = {
    locationHeader: {
        py: 1,

        '& .MuiCardHeader-content': {
            minWidth: 0,
        },
    },
};

// Properties passed to the <LocationHeader> component.
interface LocationHeaderProps {
    /**
     * The icon that should be shown on the right-hand side of the header.
     */
    icon?: h.JSX.Element;

    /**
     * Text to display in the location header.
     */
    title: string;

    /**
     * URL of the page to navigate to when the header has been clicked on.
     */
    url: string;
}

// The <LocationHeader> component displays a <CardHeader> specific to an area or location. It's used
// in various parts of the application, thus has been generalized.
export function LocationHeader(props: LocationHeaderProps) {
    const { icon, title, url } = props;

    return (
        <Link href={url} sx={{ color: 'initial', textDecoration: 'initial' }}>
            <CardHeader avatar={icon}
                        sx={kStyles.locationHeader}
                        title={title}
                        titleTypographyProps={{
                            color: 'primary',
                            fontWeight: 'normal',
                            noWrap: true,
                            variant: 'h6'
                        }} />
        </Link>
    );
}
