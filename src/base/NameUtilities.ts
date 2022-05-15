// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

/**
 * Returns the first name to use based on the `fullName`.
 */
export function firstName(fullName: string): string {
    if (typeof fullName === 'string' && fullName.length >= 1) {
        const normalized = fullName.trimLeft();
        const space = normalized.indexOf(' ');

        return space >= 1 ? normalized.substring(0, space)
                          : normalized;
    }

    return '';
}

/**
 * Returns the capitalized initial to use based on the `fullName`.
 */
export function initial(fullName: string): string {
    if (typeof fullName === 'string' && fullName.length >= 1)
        return fullName[0].toUpperCase();

    return '';
}

/**
 * Returns the capitalized initials to use based on the `fullName`.
 */
export function initials(fullName: string): string {
    let nameInitials = '';
    for (let index = 0; index < fullName.length; ++index) {
        if (fullName.charCodeAt(index) < 65 || fullName.charCodeAt(index) > 90)
            continue;

        nameInitials += fullName[index];
        if (nameInitials.length >= 2)
            break;
    }

    return nameInitials.length ? nameInitials
                               : fullName[0].toUpperCase();
}
