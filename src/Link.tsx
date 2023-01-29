// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { Ref, h } from 'preact';
import { forwardRef } from 'preact/compat';
import { route } from 'preact-router';

import { TypographyProps, default as Typography } from '@mui/material/Typography';

// Properties accepted by the <Link> component.
export type LinkProps = React.ComponentPropsWithoutRef<'a'> & TypographyProps;

// Implementation of a <Link> component, backed by a regular anchor elements, that supports both
// internal and external navigations without having to consider that at input time.
export const Link = forwardRef((props: LinkProps, forwardedRef: React.Ref<any>) => {
    const { color, href, onClick, target, ...rest } = props;

    const internalClickHandler: React.MouseEventHandler<HTMLAnchorElement> = event => {
        for (const exception of ['http://', 'https://', 'mailto:', 'tel:']) {
            if (href?.startsWith(exception))
                return;
        }

        if (target && target !== '_self')
            return;  // ignore clicks that should open in other windows

        if (event.button !== 0 || event.metaKey || event.altKey || event.ctrlKey || event.shiftKey)
            return;  // ignore clicks that include modifier keys

        event.nativeEvent.stopImmediatePropagation();
        event.nativeEvent.preventDefault();

        if (href)
            route(href);
    };

    return <Typography color={color || 'primary'}
                       component='a'
                       href={href}
                       ref={forwardedRef}
                       target={target}
                       onClick={internalClickHandler}
                       {...rest} />;
});
