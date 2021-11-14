// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { Schema } from 'ts-json-schema-generator';

import api from '../api/schema.json';

// Type of the logger function that will be used by the ApiValidator.
type LoggerFunction = (message: string, context: any) => void;

// The logger that should be used during validation. May be overwritten for tests.
let gLogger: LoggerFunction = console.error;

// Provides the ability to validate an arbirary object, given as |impact| & often received from the
// cache or network, according to the syntax set by one of the volunteer portal's APIs, given as
// the |inputApi|. Validation is done based on a predetermined schema, checked in to the source
// tree as a JSON file.
//
// For future reference, it may seem like Ajv or similar tools would've been a good option to use
// here, however, including such libraries add at least ~40 KiB to the compressed size of our
// JavaScript library. As such, an internal implementation is used instead.
export function validate<T>(input: any, inputApi: keyof typeof api.definitions): input is T {
    if (!Object.prototype.hasOwnProperty.call(api.definitions, inputApi))
        return false;

    const definition = api.definitions[inputApi];
    if (definition.type !== 'object')
        throw new Error('The volunteer portal requires each API to be based on an object.');

    return validateObject(input, definition as Schema, [ inputApi ]);
}

// Sets the logger to the given |logger|. Should only be used for testing purposes.
export function setLoggerForTests(logger: LoggerFunction): void { gLogger = logger; }

// -------------------------------------------------------------------------------------------------
// Internal functionality that should not be accessed directly.
// -------------------------------------------------------------------------------------------------

// Common error messages shared by multiple validators.
const kInvalidConstValue = 'Value is not equal to the expected constant';
const kInvalidEnumValue = 'Value is not included in the enumeration';

// Reports the given |message| as an error, which was found at the given |path|. The boolean FALSE
// will be returned, to indicate that validation could not be completed due to this issue.
function reportError(message: string, path: string[], context: any): false {
    gLogger(`[${path.join('.')}] ${message}`, context);
    return false;
}

// Validates that the given |input| is a boolean, considering a few options from |schema| as per the
// draft-handrews-json-schema-validation-01 specification.
function validateBoolean(input: any, schema: Schema, path: string[]): input is boolean {
    if (typeof input !== 'boolean')
        return reportError(`Expected type boolean, got type ${typeof input}`, path, input);

    // https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-6.1
    if (schema.enum !== undefined && !schema.enum.includes(input))
        return reportError(kInvalidEnumValue, path, input);

    if (schema.const !== undefined && schema.const !== input)
        return reportError(kInvalidConstValue, path, input);

    return true;
}

// Validates that the given |input| is an integral value, considering a few options from |schema| as
// per the draft-handrews-json-schema-validation-01 specification.
function validateInteger(input: any, schema: Schema, path: string[]): input is number {
    return validateNumeric(input, schema, path, /* integer= */ true);
}

// Validates that the given |input| is a NULL value. The |schema| is included for consistency
// reasons, but otherwise unused.
function validateNull(input: any, schema: Schema, path: string[]): input is null {
    if (typeof input !== 'object')
        return reportError(`Expected type null, got type ${typeof input}`, path, input);

    if (input !== null)
        return reportError('Value is expected to be null', path, input);

    return true;
}

// Validates that the given |input| is a number value, considering a few options from |schema| as
// per the draft-handrews-json-schema-validation-01 specification.
function validateNumber(input: any, schema: Schema, path: string[]): input is number {
    return validateNumeric(input, schema, path, /* integer= */ false);
}

// Validates that the given |input| is an numeric value, considering a few options from |schema| as
// per the draft-handrews-json-schema-validation-01 specification. This method is used to validate
// both integers and numbers, with an additional check being applied for integers.
function validateNumeric(input: any, schema: Schema, path: string[], integer: boolean): input is number {
    if (typeof input !== 'number')
        return reportError(`Expected type integer, got type ${typeof input}`, path, input);

    if (integer && !Number.isInteger(input))
        return reportError('Value is expected to be integral', path, input);

    // https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-6.1
    if (schema.enum !== undefined && !schema.enum.includes(input))
        return reportError(kInvalidEnumValue, path, input);

    if (schema.const !== undefined && schema.const !== input)
        return reportError(kInvalidConstValue, path, input);

    // https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-6.2
    if (schema.multipleOf !== undefined && (input % schema.multipleOf) !== 0)
        return reportError(`Value is not a multiple of ${schema.multipleOf}`, path, input);

    if (schema.maximum !== undefined && input > schema.maximum)
        return reportError(`Value is higher than ${schema.maximum}`, path, input);

    if (schema.exclusiveMaximum !== undefined && input >= schema.exclusiveMaximum)
        return reportError(`Value is higher than or equal to ${schema.exclusiveMaximum}`, path, input);

    if (schema.minimum !== undefined && input < schema.minimum)
        return reportError(`Value is lower than ${schema.minimum}`, path, input);

    if (schema.exclusiveMinimum !== undefined && input <= schema.exclusiveMinimum)
        return reportError(`Value is lower than or equal to ${schema.exclusiveMinimum}`, path, input);

    return true;
}

// Validates that the given |input| corresponds to an object with the given |schema|. The |path|
// will be used to display error messages in case any are seen.
function validateObject(input: any, schema: Schema, path: string[]): input is object {
    // TODO: implement support for objects
    return false;
}

// Validatse that the given |input| corresponds to a string, considering various options from the
// given |schema| per the draft-handrews-json-schema-validation-01 specification.
function validateString(input: any, schema: Schema, path: string[]): input is string {
    if (typeof input !== 'string')
        return reportError(`Expected type string, got type ${typeof input}`, path, input);

    // https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-6.1
    if (schema.enum !== undefined && !schema.enum.includes(input))
        return reportError(kInvalidEnumValue, path, input);

    if (schema.const !== undefined && schema.const !== input)
        return reportError(kInvalidConstValue, path, input);

    // https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-6.3
    if (schema.maxLength !== undefined && input.length > schema.maxLength)
        return reportError(`Value is longer than ${schema.maxLength} character(s)`, path, input);

    if (schema.minLength !== undefined && input.length < schema.minLength)
        return reportError(`Value is shorter than ${schema.minLength} character(s)`, path, input);

    if (schema.pattern !== undefined && !(new RegExp(schema.pattern)).test(input))
        return reportError('Value does not match the required pattern', path, input);

    return true;
}

// Export all the individual validators for use in testing functions.
export const validators = {
    validateBoolean,
    validateInteger,
    validateNull,
    validateNumber,
    validateString,
};
