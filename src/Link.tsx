// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { Ref, h } from 'preact';
import { forwardRef } from 'preact/compat';
import { route } from 'preact-router';

// Properties accepted by the <Link> component.
export type LinkProps = h.JSX.HTMLAttributes<HTMLAnchorElement> & {
    // Destination of the link. Can be any value accepted by the HTML <a> element.
    href?: string;

    // Event handler that should be called when the link gets activated. Takes precedence over the
    // built-in navigation handler. Exceptions thrown are fatal.
    onClick?: h.JSX.MouseEventHandler<HTMLAnchorElement>;
}

// Implementation of a <Link> component, backed by a regular anchor elements, that supports both
// internal and external navigations without having to consider that at input time.
export const Link = forwardRef((props: LinkProps, forwardedRef: Ref<any>) => {
    const { href, onClick, target, ...rest } = props;

    const internalClickHandler = (event: h.JSX.TargetedMouseEvent<HTMLAnchorElement>) => {
        try {
            if (onClick)
                onClick.call((event.currentTarget || event.target) as HTMLAnchorElement, event);

        } catch (exception) {
            event.stopImmediatePropagation();
            event.preventDefault();

            throw exception;
        }

        if (event.defaultPrevented)
            return;  // the higher-level onClick handler canceled the event

        for (const exception of ['http://', 'https://', 'mailto:', 'tel:']) {
            if (href?.startsWith(exception))
                return;
        }

        if (target && target !== '_self')
            return;  // ignore clicks that should open in other windows

        if (event.button !== 0 || event.metaKey || event.altKey || event.ctrlKey || event.shiftKey)
            return;  // ignore clicks that include modifier keys

        event.stopImmediatePropagation();
        event.preventDefault();

        if (href)
            route(href);
    };

    return <a ref={forwardedRef}
              href={href}
              target={target}
              onClick={internalClickHandler}
              {...rest} />;
});
