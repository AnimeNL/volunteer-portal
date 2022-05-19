// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { useEffect } from 'preact/hooks';

// The listener to invoke when the app's title is being updated, if any.
let g_listener: AppTitleListener | undefined;

// Interface for the listener that will be invoked whenever the app's title changes.
export interface AppTitleListener {
    onAppTitleChange(newTitle?: string): void;
}

// Clears the currently registered title listener.
export function clearTitleListener() {
    g_listener = undefined;
}

// Updates the application title listener to |listener|.
export function setTitleListener(listener?: AppTitleListener) {
    g_listener = listener;
}

// Properties for the <AppTitle> component.
export interface AppTitleProps {
    children?: never;  // explicitly disallow children
    title?: string;
}

// The <AppTitle> component, which can be used in the virtual DOM to actually update the title that
// should be assigned to the page. Relies on an app title listener to have been registered.
export function AppTitle(props: AppTitleProps): null {
    useEffect(() => {
        if (g_listener)
            g_listener.onAppTitleChange(props.title);
    }, [ props.title ]);

    return null;  // nothing to render
}
