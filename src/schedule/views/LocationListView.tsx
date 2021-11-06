// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { h } from 'preact';

export interface LocationListViewProps {
    area: string;
};

export function LocationListView(props: LocationListViewProps) {
    return <p>LocationListView({props.area})</p>;
}
