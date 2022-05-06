// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { h } from 'preact';
import PreactMarkdown from 'preact-markdown';

import Box from '@mui/material/Box';
import { SxProps, Theme } from '@mui/system';

import { Link } from '../../Link';

// CSS customizations applied to the <Markdown> component.
const kContainerStyles: SxProps<Theme> = {
    '& p': {
        marginTop: 0,
    },
    '& p:last-child': {
        marginBottom: 0,
    }
};

// Properties accepted by the <Markdown> component.
export interface MarkdownProps {
    // The content that should be rendered by this component.
    content: string;
}

// The <Markdown> component is able to display markdown-formatted content in a regular React view.
// Styling is applied to have it fit well within the MUI styling, and work correctly with Dark Mode
// and the rest of the volunteer portal's layout.
export function Markdown(props: MarkdownProps) {
    const markdown = PreactMarkdown({
        markdown: props.content,
        markupOpts: {
            components: {
                a: Link,
            }
        },
    });

    return <Box sx={kContainerStyles}>{markdown}</Box>;
}
