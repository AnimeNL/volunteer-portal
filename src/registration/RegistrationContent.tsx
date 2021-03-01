// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { Fragment, h } from 'preact';
import Markdown from 'preact-markdown';

import { ContentPage } from '../base/Content';

// Properties accepted by the <RegistrationContent> component.
export interface RegistrationContentProps {
    page: ContentPage;
}

// Responsible for displaying a single page of content on the registration app, specifically one
// that is powered through server-provided content to be displayed using Markdown.
export function RegistrationContent(props: RegistrationContentProps) {
    const markdown = Markdown({
        markdown: props.page.content,
    });

    return markdown;
}
