// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

type ValidateFn = (input: any) => boolean;

/**
 * Issues an error message explaining why validation of the |property| on |inputName| failed.
 * 
 * @param inputName Name of the interface for which we're doing validations.
 * @param property The property which is expected to exist on the input object.
 * @param message Message that details why validation has failed.
 * @returns The boolean False to make the code a bit more streamlined.
 */
function issueErrorAndReturnFalse(inputName: string, property: string, message: string): false {
    console.error(`Unable to validate ${inputName}.${property}: ${message}.`);
    return false;
}

/**
 * Validates that the |property| exists on the given |input|, and validates for the given
 * |validateFn|. The |inputName| will be used for a clear error output if failing.
 *
 * @param input Input object that may or may not have a |property| member.
 * @param inputName Name of the interface for which we're doing validations.
 * @param property The property which is expected to exist on the |input|.
 * @param validateFn The function that will be doing the type validation.
 * @returns Whether the validation has been successful.
 */
function validate(input: any, inputName: string, property: string, validateFn: ValidateFn): boolean {
    if (!input)
        return issueErrorAndReturnFalse(inputName, property, 'the given input is null or undefined');

    if (!input.hasOwnProperty(property))
        return issueErrorAndReturnFalse(inputName, property, 'the property does not exist');

    if (!validateFn(input[property]))
        return issueErrorAndReturnFalse(inputName, property, 'the property has an invalid value');

    return true
}

function isBoolean(input: any): boolean {
    return typeof input === 'boolean';
}

function isArray(input: any): boolean {
    return typeof input === 'object' && Array.isArray(input);
}

function isNumber(input: any): boolean {
    return typeof input === 'number';
}

function isString(input: any): boolean {
    return typeof input === 'string';
}

/**
 * Validates that the |property| on the |input| object of type |inputName| is an array.
 */
export function validateArray(input: any, inputName: string, property: string): boolean {
    return validate(input, inputName, property, isArray);
}

/**
 * Validates that the |property| on the |input| object of type |inputName| is a boolean. 
 */
export function validateBoolean(input: any, inputName: string, property: string): boolean {
    return validate(input, inputName, property, isBoolean);
}

/**
 * Validates that the |property| on the |input| object of type |inputName| is a number.
 */
export function validateNumber(input: any, inputName: string, property: string): boolean {
    return validate(input, inputName, property, isNumber);
}

/**
 * Validates that the |property| on the |input| object of type |inputName| is a string.
 */
export function validateString(input: any, inputName: string, property: string): boolean {
    return validate(input, inputName, property, isString);
}
