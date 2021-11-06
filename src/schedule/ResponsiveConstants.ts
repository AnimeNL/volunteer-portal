// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

// Minimum width, in pixels, the portal should be on desktop platforms.
export const kDesktopMinimumWidthPx = 1200;

// Maximum width, in pixels, the portal should use on desktop platforms.
export const kDesktopMaximumWidthPx = 1600;

// Width, in pixels, the main menu should occupy on desktop platforms. This is a fixed size, and
// will be applied no matter the width that will be taken by the content.
export const kDesktopMenuWidthPx = 275;

// Minimum width, in pixels, the main content should occupy on desktop platforms.
export const kDesktopContentMinimumWidthPx = kDesktopMinimumWidthPx - 2 * kDesktopMenuWidthPx;

// Maximum width, in pixels, the main content should occupy on desktop platforms.
export const kDesktopContentMaximumWidthPx = kDesktopMaximumWidthPx - 2 * kDesktopMenuWidthPx;
