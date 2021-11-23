// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { RestoreConsole, default as mockConsole } from 'jest-mock-console';

import { validate, validators } from './ApiValidator';

import { IContentResponse } from '../api/IContent';
import { IEnvironmentResponse } from '../api/IEnvironment';

describe('ApiValidator', () => {
    let restoreConsole: RestoreConsole | undefined = undefined;

    beforeEach(() => restoreConsole = mockConsole());
    afterEach(() => restoreConsole!());

    it('should be able to validate known API types', () => {
        expect(validate<IContentResponse>({ pages: [] }, 'IContentResponse')).toBeTruthy();
        expect(validate<IContentResponse>({
            pages: [
                {
                    pathname: '/test/index',
                    content: 'Hello, world',
                    modified: 1636905952,
                },
            ],
        }, 'IContentResponse')).toBeTruthy();

        expect(validate<IEnvironmentResponse>({
            title: 'Festival',

            themeColor: '#ff0000',
            themeTitle: 'Festivalz',

            events: [
                {
                    name: 'Festival 2022',
                    enableContent: true,
                    enableRegistration: false,
                    enableSchedule: false,
                    identifier: 'my-event',
                },
            ],

            contactName: 'administrator',
            contactTarget: 'info@website.com',
        }, 'IEnvironmentResponse')).toBeTruthy();

        expect(validate<IEnvironmentResponse>({
            identifier: 'my-event',
        }, 'IEnvironmentResponse')).toBeFalsy();

        expect(console.error).toHaveBeenLastCalledWith(
            '[IEnvironmentResponse] Value is expected to have property "title"',
            /* context= */ expect.anything());

        expect(validate<IContentResponse>([ true ], 'IContentResponse')).toBeFalsy();
        expect(console.error).toHaveBeenLastCalledWith(
            '[IContentResponse] Expected type object, got type array',
            /* context= */ expect.anything());

        expect(validate<IContentResponse>({
            pages: [
                {
                    pathname: '/test/index',
                    // missing key: content
                    modified: 1636905952,
                },
            ],
        }, 'IContentResponse')).toBeFalsy();

        expect(console.error).toHaveBeenLastCalledWith(
            '[IContentResponse.pages.0] Value is expected to have property "content"',
            /* context= */ expect.anything());

        expect(validate<IEnvironmentResponse>({
            title: 'Festival',

            themeColor: '#ff0000',
            themeTitle: 'Festivalz',

            events: [
                {
                    name: 'My event',
                    enableContent: true,
                    enableRegistration: false,
                    enableSchedule: false,
                    identifier: 2022,  // <-- unexpected type
                },
            ],

            contactName: 'administrator',
            contactTarget: 'info@website.com',
        }, 'IEnvironmentResponse')).toBeFalsy();

        expect(console.error).toHaveBeenLastCalledWith(
            '[IEnvironmentResponse.events.0.identifier] Expected type string, got type number',
            /* context= */ expect.anything());
    });

    // ---------------------------------------------------------------------------------------------
    // Validation of scalar types
    // ---------------------------------------------------------------------------------------------

    it('should be able to validate booleans', () => {
        expect(validators.validateBoolean(null, {}, [ 'IBool' ])).toBeFalsy();
        expect(console.error).toHaveBeenLastCalledWith(
            '[IBool] Expected type boolean, got type object', /* context= */ null);

        expect(validators.validateBoolean(3.14, {}, [ 'IBool' ])).toBeFalsy();
        expect(console.error).toHaveBeenLastCalledWith(
            '[IBool] Expected type boolean, got type number', /* context= */ 3.14);

        expect(validators.validateBoolean('false', {}, [ 'IBool' ])).toBeFalsy();
        expect(console.error).toHaveBeenLastCalledWith(
            '[IBool] Expected type boolean, got type string', /* context= */ 'false');

        expect(validators.validateBoolean(true, {}, [ 'IBool' ])).toBeTruthy();
        expect(validators.validateBoolean(false, {}, [ 'IBool' ])).toBeTruthy();

        expect(validators.validateBoolean(true, { enum: [ true ] }, [ 'IBool' ])).toBeTruthy();
        expect(validators.validateBoolean(true, { enum: [ false ] }, [ 'IBool' ])).toBeFalsy();
        expect(console.error).toHaveBeenLastCalledWith(
            '[IBool] Value is not included in the enumeration', /* context= */ true);

        expect(validators.validateBoolean(true, { const: true }, [ 'IBool' ])).toBeTruthy();
        expect(validators.validateBoolean(true, { const: false }, [ 'IBool' ])).toBeFalsy();
        expect(console.error).toHaveBeenLastCalledWith(
            '[IBool] Value is not equal to the expected constant', /* context= */ true);
    });

    it('should be able to validate integers and numbers', () => {
        expect(validators.validateInteger(null, {}, [ 'IInteger' ])).toBeFalsy();
        expect(console.error).toHaveBeenLastCalledWith(
            '[IInteger] Expected type integer, got type object', /* context= */ null);

        expect(validators.validateInteger(false, {}, [ 'IInteger' ])).toBeFalsy();
        expect(console.error).toHaveBeenLastCalledWith(
            '[IInteger] Expected type integer, got type boolean', /* context= */ false);

        expect(validators.validateInteger('false', {}, [ 'IInteger' ])).toBeFalsy();
        expect(console.error).toHaveBeenLastCalledWith(
            '[IInteger] Expected type integer, got type string', /* context= */ 'false');

        // Integers should be integral [branch]
        expect(validators.validateInteger(-9001, {}, [ 'IInteger' ])).toBeTruthy();
        expect(validators.validateInteger(-9001.5, {}, [ 'IInteger' ])).toBeFalsy();
        expect(validators.validateInteger(0, {}, [ 'IInteger' ])).toBeTruthy();
        expect(validators.validateInteger(0.5, {}, [ 'IInteger' ])).toBeFalsy();
        expect(validators.validateInteger(9001, {}, [ 'IInteger' ])).toBeTruthy();
        expect(validators.validateInteger(9001.5, {}, [ 'IInteger' ])).toBeFalsy();
        expect(console.error).toHaveBeenLastCalledWith(
            '[IInteger] Value is expected to be integral', /* context= */ 9001.5);

        // Numbers may have decimals [branch]
        expect(validators.validateNumber(-9001, {}, [ 'INumber' ])).toBeTruthy();
        expect(validators.validateNumber(-9001.5, {}, [ 'INumber' ])).toBeTruthy();
        expect(validators.validateNumber(0, {}, [ 'INumber' ])).toBeTruthy();
        expect(validators.validateNumber(0.5, {}, [ 'INumber' ])).toBeTruthy();
        expect(validators.validateNumber(9001, {}, [ 'INumber' ])).toBeTruthy();
        expect(validators.validateNumber(9001.5, {}, [ 'INumber' ])).toBeTruthy();

        expect(validators.validateInteger(1, { enum: [ 1, 2 ] }, [ 'IInteger' ])).toBeTruthy();
        expect(validators.validateInteger(2, { enum: [ 1, 2 ] }, [ 'IInteger' ])).toBeTruthy();
        expect(validators.validateInteger(3, { enum: [ 1, 2 ] }, [ 'IInteger' ])).toBeFalsy();
        expect(console.error).toHaveBeenLastCalledWith(
            '[IInteger] Value is not included in the enumeration',
            /* context= */ expect.anything());

        expect(validators.validateInteger(42, { const: 42 }, [ 'IInteger' ])).toBeTruthy();
        expect(validators.validateInteger(43, { const: 42 }, [ 'IInteger' ])).toBeFalsy();
        expect(console.error).toHaveBeenLastCalledWith(
            '[IInteger] Value is not equal to the expected constant',
            /* context= */ expect.anything());

        expect(validators.validateInteger(0, { multipleOf: 3 }, [ 'IInteger' ])).toBeTruthy();
        expect(validators.validateInteger(3, { multipleOf: 3 }, [ 'IInteger' ])).toBeTruthy();
        expect(validators.validateInteger(6, { multipleOf: 3 }, [ 'IInteger' ])).toBeTruthy();
        expect(validators.validateInteger(10, { multipleOf: 3 }, [ 'IInteger' ])).toBeFalsy();
        expect(console.error).toHaveBeenLastCalledWith(
            '[IInteger] Value is not a multiple of 3', /* context= */ expect.anything());

        expect(validators.validateInteger(0, { maximum: 5 }, [ 'IInteger' ])).toBeTruthy();
        expect(validators.validateInteger(5, { maximum: 5 }, [ 'IInteger' ])).toBeTruthy();
        expect(validators.validateInteger(6, { maximum: 5 }, [ 'IInteger' ])).toBeFalsy();
        expect(console.error).toHaveBeenLastCalledWith(
            '[IInteger] Value is higher than 5', /* context= */ expect.anything());

        expect(validators.validateInteger(0, { exclusiveMaximum: 5 }, [ 'IInteger' ])).toBeTruthy();
        expect(validators.validateInteger(4, { exclusiveMaximum: 5 }, [ 'IInteger' ])).toBeTruthy();
        expect(validators.validateInteger(5, { exclusiveMaximum: 5 }, [ 'IInteger' ])).toBeFalsy();
        expect(console.error).toHaveBeenLastCalledWith(
            '[IInteger] Value is higher than or equal to 5', /* context= */ expect.anything());

        expect(validators.validateInteger(6, { minimum: 5 }, [ 'IInteger' ])).toBeTruthy();
        expect(validators.validateInteger(5, { minimum: 5 }, [ 'IInteger' ])).toBeTruthy();
        expect(validators.validateInteger(0, { minimum: 5 }, [ 'IInteger' ])).toBeFalsy();
        expect(console.error).toHaveBeenLastCalledWith(
            '[IInteger] Value is lower than 5', /* context= */ expect.anything());

        expect(validators.validateInteger(6, { exclusiveMinimum: 5 }, [ 'IInteger' ])).toBeTruthy();
        expect(validators.validateInteger(5, { exclusiveMinimum: 5 }, [ 'IInteger' ])).toBeFalsy();
        expect(console.error).toHaveBeenLastCalledWith(
            '[IInteger] Value is lower than or equal to 5', /* context= */ expect.anything());
    });

    it('should be able to validate NULL values', () => {
        expect(validators.validateNull(true, {}, [ 'INull' ])).toBeFalsy();
        expect(console.error).toHaveBeenLastCalledWith(
            '[INull] Expected type null, got type boolean', /* context= */ true);

        expect(validators.validateNull(3.14, {}, [ 'INull' ])).toBeFalsy();
        expect(console.error).toHaveBeenLastCalledWith(
            '[INull] Expected type null, got type number', /* context= */ 3.14);

        expect(validators.validateNull('null', {}, [ 'INull' ])).toBeFalsy();
        expect(console.error).toHaveBeenLastCalledWith(
            '[INull] Expected type null, got type string', /* context= */ 'null');

        expect(validators.validateNull(null, {}, [ 'INull' ])).toBeTruthy();

        expect(validators.validateNull({}, {}, [ 'INull' ])).toBeFalsy();
        expect(console.error).toHaveBeenLastCalledWith(
            '[INull] Value is expected to be null', /* context= */ expect.anything());
    });

    it('should be able to validate strings', () => {
        expect(validators.validateString(null, {}, [ 'IString' ])).toBeFalsy();
        expect(console.error).toHaveBeenLastCalledWith(
            '[IString] Expected type string, got type object', /* context= */ null);

        expect(validators.validateString(true, {}, [ 'IString' ])).toBeFalsy();
        expect(console.error).toHaveBeenLastCalledWith(
            '[IString] Expected type string, got type boolean', /* context= */ true);

        expect(validators.validateString(3.14, {}, [ 'IString' ])).toBeFalsy();
        expect(console.error).toHaveBeenLastCalledWith(
            '[IString] Expected type string, got type number', /* context= */ 3.14);

        expect(validators.validateString('', {}, [ 'IString' ])).toBeTruthy();
        expect(validators.validateString('hello world', {}, [ 'IString' ])).toBeTruthy();

        expect(validators.validateString('a', { enum: [ 'a', 'b' ] }, [ 'IString' ])).toBeTruthy();
        expect(validators.validateString('c', { enum: [ 'a', 'b' ] }, [ 'IString' ])).toBeFalsy();
        expect(console.error).toHaveBeenLastCalledWith(
            '[IString] Value is not included in the enumeration', /* context= */ 'c');

        expect(validators.validateString('a', { const: 'a' }, [ 'IString' ])).toBeTruthy();
        expect(validators.validateString('b', { const: 'a' }, [ 'IString' ])).toBeFalsy();
        expect(console.error).toHaveBeenLastCalledWith(
            '[IString] Value is not equal to the expected constant', /* context= */ 'b');

        expect(validators.validateString('a', { maxLength: 3 }, [ 'IString' ])).toBeTruthy();
        expect(validators.validateString('bb', { maxLength: 3 }, [ 'IString' ])).toBeTruthy();
        expect(validators.validateString('ccc', { maxLength: 3 }, [ 'IString' ])).toBeTruthy();
        expect(validators.validateString('dddd', { maxLength: 3 }, [ 'IString' ])).toBeFalsy();
        expect(console.error).toHaveBeenLastCalledWith(
            '[IString] Value is longer than 3 character(s)', /* context= */ 'dddd');

        expect(validators.validateString('dddd', { minLength: 3 }, [ 'IString' ])).toBeTruthy();
        expect(validators.validateString('ccc', { minLength: 3 }, [ 'IString' ])).toBeTruthy();
        expect(validators.validateString('bb', { minLength: 3 }, [ 'IString' ])).toBeFalsy();
        expect(console.error).toHaveBeenLastCalledWith(
            '[IString] Value is shorter than 3 character(s)', /* context= */ 'bb');

        expect(validators.validateString('42', { pattern: '^\\d+$' }, [ 'IString' ])).toBeTruthy();
        expect(validators.validateString('zz', { pattern: '^\\d+$' }, [ 'IString' ])).toBeFalsy();
        expect(console.error).toHaveBeenLastCalledWith(
            '[IString] Value does not match the required pattern', /* context= */ 'zz');
    });

    // ---------------------------------------------------------------------------------------------
    // Validation of complex types
    // ---------------------------------------------------------------------------------------------

    it('should be able to validate arrays', () => {
        expect(validators.validateArray(null, {}, [ 'IArray' ])).toBeFalsy();
        expect(console.error).toHaveBeenLastCalledWith(
            '[IArray] Expected type array, got type object', /* context= */ null);

        expect(validators.validateArray(true, {}, [ 'IArray' ])).toBeFalsy();
        expect(console.error).toHaveBeenLastCalledWith(
            '[IArray] Expected type array, got type boolean', /* context= */ true);

        expect(validators.validateArray(3.14, {}, [ 'IArray' ])).toBeFalsy();
        expect(console.error).toHaveBeenLastCalledWith(
            '[IArray] Expected type array, got type number', /* context= */ 3.14);

        expect(validators.validateArray({}, {}, [ 'IArray' ])).toBeFalsy();
        expect(console.error).toHaveBeenLastCalledWith(
            '[IArray] Expected type array, got type object', /* context= */ expect.anything());

        expect(validators.validateArray([], {}, [ 'IArray' ])).toBeTruthy();
        expect(validators.validateArray([ 1, 2, 3 ], {}, [ 'IArray' ])).toBeTruthy();

        expect(validators.validateArray([ 1 ], { maxItems: 2 }, [ 'IArray' ])).toBeTruthy();
        expect(validators.validateArray([ 1, 2 ], { maxItems: 2 }, [ 'IArray' ])).toBeTruthy();
        expect(validators.validateArray([ 1, 2, 3 ], { maxItems: 2 }, [ 'IArray' ])).toBeFalsy();
        expect(console.error).toHaveBeenLastCalledWith(
            '[IArray] Value has more than 2 item(s)', /* context= */ expect.anything());

        expect(validators.validateArray([ 1, 2, 3 ], { minItems: 2 }, [ 'IArray' ])).toBeTruthy();
        expect(validators.validateArray([ 1, 2 ], { minItems: 2 }, [ 'IArray' ])).toBeTruthy();
        expect(validators.validateArray([ 1 ], { minItems: 2 }, [ 'IArray' ])).toBeFalsy();
        expect(console.error).toHaveBeenLastCalledWith(
            '[IArray] Value has less than 2 item(s)', /* context= */ expect.anything());

        expect(validators.validateArray([ 1 ], { uniqueItems: false }, [ 'IArray' ])).toBeTruthy();
        expect(validators.validateArray([ 1, 2 ], { uniqueItems: false }, ['IArray'])).toBeTruthy();
        expect(validators.validateArray([ 1, 1 ], { uniqueItems: false }, ['IArray'])).toBeTruthy();
        expect(validators.validateArray([ 1 ], { uniqueItems: true }, [ 'IArray' ])).toBeTruthy();
        expect(validators.validateArray([ 1, 2 ], { uniqueItems: true }, ['IArray'])).toBeTruthy();
        expect(validators.validateArray([ 1, 1 ], { uniqueItems: true }, ['IArray'])).toBeFalsy();
        expect(console.error).toHaveBeenLastCalledWith(
            '[IArray] Items in this array are expected to be unique',
            /* context= */ expect.anything());

        expect(validators.validateArray([ 1, 2, 3 ], { items: { type: 'number' } }, [ 'IArray' ]))
            .toBeTruthy();

        expect(validators.validateArray([ 1, 2, '3' ], { items: { type: 'number' } }, [ 'IArray' ]))
            .toBeFalsy();
        expect(console.error).toHaveBeenLastCalledWith(
            '[IArray.2] Expected type integer, got type string',
            /* context= */ expect.anything());

        expect(validators.validateArray([ 1, '2', [ 3 ] ], {
            items: [
                { type: 'number' },
                { type: 'string' },
                {
                    type: 'array',
                    items: {
                        type: 'boolean',  // <-- number given
                    }
                }
            ]
        }, [ 'IArray' ])).toBeFalsy();

        expect(console.error).toHaveBeenLastCalledWith(
            '[IArray.2.0] Expected type boolean, got type number',
            /* context= */ expect.anything());

        // Neither `enum` nor `const` are implemented for arrays. Change detector tests:
        expect(validators.validateArray([], { enum: [ [ 2 ] ] }, [ 'IArray' ])).toBeTruthy();
        expect(validators.validateArray([], { const: [ 2 ] }, [ 'IArray' ])).toBeTruthy();
    });

    it('should be able to validate objects', () => {
        expect(validators.validateObject(null, {}, [ 'IObject' ])).toBeFalsy();
        expect(console.error).toHaveBeenLastCalledWith(
            '[IObject] Expected type object, got type null', /* context= */ null);

        expect(validators.validateObject(true, {}, [ 'IObject' ])).toBeFalsy();
        expect(console.error).toHaveBeenLastCalledWith(
            '[IObject] Expected type object, got type boolean', /* context= */ true);

        expect(validators.validateObject(3.14, {}, [ 'IObject' ])).toBeFalsy();
        expect(console.error).toHaveBeenLastCalledWith(
            '[IObject] Expected type object, got type number', /* context= */ 3.14);

        expect(validators.validateObject([], {}, [ 'IObject' ])).toBeFalsy();
        expect(console.error).toHaveBeenLastCalledWith(
            '[IObject] Expected type object, got type array', /* context= */ expect.anything());

        expect(validators.validateObject({}, {}, [ 'IObject' ])).toBeTruthy();
        expect(validators.validateObject({ a: 1 }, {}, [ 'IObject' ])).toBeTruthy();

        expect(validators.validateObject({}, { maxProperties: 1 }, [ 'IObject' ])).toBeTruthy();
        expect(validators.validateObject({ a: 1 }, { maxProperties: 1 }, [ 'IObject' ]))
            .toBeTruthy();
        expect(validators.validateObject({ a: 1, b: 2 }, { maxProperties: 1 }, [ 'IObject' ]))
            .toBeFalsy();
        expect(console.error).toHaveBeenLastCalledWith(
            '[IObject] Value has more than 1 properties',
            /* context= */ expect.anything());

        expect(validators.validateObject({ a: 1, b: 2 }, { minProperties: 1 }, [ 'IObject' ]))
            .toBeTruthy();
        expect(validators.validateObject({ a: 1 }, { minProperties: 1 }, [ 'IObject' ]))
            .toBeTruthy();
        expect(validators.validateObject({}, { minProperties: 1 }, [ 'IObject' ])).toBeFalsy();
        expect(console.error).toHaveBeenLastCalledWith(
            '[IObject] Value has less than 1 properties',
            /* context= */ expect.anything());

        expect(validators.validateObject({ a: 1, b: 2 }, { required: ['b'] }, [ 'IObject' ]))
            .toBeTruthy();
        expect(validators.validateObject({ a: 1 }, { required: ['b'] }, [ 'IObject' ]))
            .toBeFalsy();
        expect(console.error).toHaveBeenLastCalledWith(
            '[IObject] Value is expected to have property "b"',
            /* context= */ expect.anything());

        expect(validators.validateObject({ foo: 1 }, {
            propertyNames: { pattern: '^[a-z]+$' },
        }, [ 'IObject' ])).toBeTruthy();

        expect(validators.validateObject({ foo: 1, bar: 2 }, {
            propertyNames: { pattern: '^[a-z]+$' },
        }, [ 'IObject' ])).toBeTruthy();

        expect(validators.validateObject({ foo: 1, bar3: 2 }, {
            propertyNames: { pattern: '^[a-z]+$' },
        }, [ 'IObject' ])).toBeFalsy();
        expect(console.error).toHaveBeenLastCalledWith(
            '[IObject] Value property "bar3" fails the pattern',
            /* context= */ expect.anything());

        expect(validators.validateObject({ a: 1 }, {
            properties: { a: { type: 'number' } }
        }, [ 'IObject' ])).toBeTruthy();

        expect(validators.validateObject({ a: 'string' }, {
            properties: { a: { type: 'number' } }
        }, [ 'IObject' ])).toBeFalsy();
        expect(console.error).toHaveBeenLastCalledWith(
            '[IObject.a] Expected type integer, got type string',
            /* context= */ expect.anything());

        expect(validators.validateObject({ a: 1, b: 'text' }, {
            properties: { a: { type: 'number' }, b: { type: 'string' } }
        }, [ 'IObject' ])).toBeTruthy();

        expect(validators.validateObject({ a: 1, b: 1, c: 'text', d: 'text' }, {
            patternProperties: {
                '^[ab]': { type: 'number' },
                '^[cd]': { type: 'string' },
            },
        }, [ 'IObject' ])).toBeTruthy();

        expect(validators.validateObject({ a: 1, b: 1, c: 'text', d: true }, {
            patternProperties: {
                '^[ab]': { type: 'number' },
                '^[cd]': { type: 'string' },
            },
        }, [ 'IObject' ])).toBeFalsy();
        expect(console.error).toHaveBeenLastCalledWith(
            '[IObject.d] Expected type string, got type boolean',
            /* context= */ expect.anything());

        expect(validators.validateObject({ a: 1, b: 2 }, {
            properties: { a: { type: 'number' } },
            additionalProperties: true,
        }, [ 'IObject' ])).toBeTruthy();

        expect(validators.validateObject({ a: 1, b: 2 }, {
            properties: { a: { type: 'number' } },
            additionalProperties: false,
        }, [ 'IObject' ])).toBeFalsy();
        expect(console.error).toHaveBeenLastCalledWith(
            '[IObject] Value includes unevaluated properties',
            /* context= */ expect.anything());

        expect(validators.validateObject({ a: 1, foobar: 2 }, {
            patternProperties: { '^[a-z]$': { type: 'number' } },
            additionalProperties: false,
        }, [ 'IObject' ])).toBeFalsy();
        expect(console.error).toHaveBeenLastCalledWith(
            '[IObject] Value includes unevaluated properties',
            /* context= */ expect.anything());

        expect(validators.validateObject({ a: 123, b: 456, c: 'value' }, {
            additionalProperties: { type: 'number' },
        }, [ 'IObject'])).toBeFalsy();
        expect(console.error).toHaveBeenLastCalledWith(
            '[IObject.c] Expected type integer, got type string',
            /* context= */ expect.anything());

        expect(validators.validateObject({ a: 1, b: 2, c: 'hi', d: 'world', e: true, f: false }, {
            additionalProperties: { type: 'boolean' },
            patternProperties: {
                '^[ab]': { type: 'number' },
                '^[cd]': { type: 'string' },
            },
        }, [ 'IObject' ])).toBeTruthy();

        // Neither `enum` nor `const` are implemented for objects. Change detector tests:
        expect(validators.validateObject({}, { enum: [ { a: 1 } ] }, [ 'IObject' ])).toBeTruthy();
        expect(validators.validateObject({}, { const: { a: 1 } }, [ 'IObject' ])).toBeTruthy();
    });
});
