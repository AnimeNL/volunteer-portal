// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { h } from 'preact';
import Markdown from 'preact-markdown';

import Box from '@mui/material/Box';
import { SxProps, Theme } from '@mui/system';
import { lighten } from '@mui/material/styles';

import { ContentPage } from '../base/Content';
import { Link } from '../Link';

// CSS customizations applied to the <RegistrationContent> component.
const kContainerStyles: SxProps<Theme> = {
    marginX: 2,

    '& blockquote': {
        backgroundColor: theme => lighten(theme.palette.error.main, .8),
        border: theme => '1px solid ' + theme.palette.error.main,
        borderRadius: theme => theme.shape.borderRadius,
        margin: 0,

        '& p': {
            margin: 1,
        }
    },

    '& h2, h3': { marginBottom: 0 },

    '& h2 + p, h2 + ul': { marginTop: 0 },
    '& h3 + p, h3 + ul': { marginTop: 0 },

    '& li p': {
        margin: 0,
    },

    '& table': { borderCollapse: 'collapse' },
    '& td, th': {
        border: theme => '1px solid ' + theme.palette.divider,
        paddingX: 1,
        paddingY: 0.5,
    },

    '& th': {
        textAlign: 'left',
    }
};

// Properties accepted by the <RegistrationContent> component.
export interface RegistrationContentProps {
    // The page entry that should be rendered within this component.
    contentPage: ContentPage;

    // Slug for the event, which provides the base URL for linkable content.
    eventSlug: string;
}

// Responsible for displaying a single page of content on the registration app, specifically one
// that is powered through server-provided content to be displayed using Markdown.
export function RegistrationContent(props: RegistrationContentProps) {
    const { contentPage, eventSlug } = props;

    const markdown = Markdown({
        markdown: contentPage.content,
        markdownOpts: {
            baseUrl: `/registration/${eventSlug}/`,
        },
        markupOpts: {
            components: {
                a: Link,
            }
        },
    });

    return <Box sx={kContainerStyles}>{markdown}</Box>;
}
