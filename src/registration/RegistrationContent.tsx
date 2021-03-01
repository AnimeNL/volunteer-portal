// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { Fragment, h } from 'preact';
import Markdown from 'preact-markdown';

import { makeStyles } from '@material-ui/core/styles';

import { ContentPage } from '../base/Content';
import { Link } from '../Link';

// CSS customizations applied to the <RegistrationContent> component.
const useStyles = makeStyles(theme => ({
    container: {
        margin: theme.spacing(0, 2),

        '& a': {
            color: '#4e342e',
        },

        '& blockquote': {
            backgroundColor: '#FFEBEE',
            border: '1px solid #F44336',
            borderRadius: theme.shape.borderRadius,
            margin: 0,

            '& p': {
                margin: theme.spacing(1),
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
            border: '1px solid ' + theme.palette.divider,
            padding: theme.spacing(0.5, 1),
        },

        '& th': {
            textAlign: 'left',
        }
    }
}));

// Properties accepted by the <RegistrationContent> component.
export interface RegistrationContentProps {
    page: ContentPage;
}

// Responsible for displaying a single page of content on the registration app, specifically one
// that is powered through server-provided content to be displayed using Markdown.
export function RegistrationContent(props: RegistrationContentProps) {
    const classes = useStyles();
    const markdown = Markdown({
        markdown: props.page.content,
        markdownOpts: {
            baseUrl: `/registration/2020-classic/`,
        },
        markupOpts: {
            components: {
                a: Link,
            }
        },
    });

    return <div className={classes.container}>{markdown}</div>;
}
