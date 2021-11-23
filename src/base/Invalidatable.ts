// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

// Interface that should be implemented by any object that can be invalidated by outside producers.
// The exact meaning of invalidation is left undefined, and should be derived from the context.
export interface Invalidatable {
    invalidate(): void;
}
