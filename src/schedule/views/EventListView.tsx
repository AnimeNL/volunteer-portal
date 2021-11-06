// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { h } from 'preact';

export interface EventListViewProps {
    area: string;
    location: string;
};

export function EventListView(props: EventListViewProps) {
    return <p>EventListView({props.area}, {props.location})</p>;
}
