// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { setLoggerForTests, validate, validators } from './ApiValidator';

describe('ApiValidator', () => {
    let errors: [string, any][] = [];
    let lastError: string | undefined;

    beforeEach(() => {
        setLoggerForTests((message: string, context: any) => {
            errors.push([ message, context ]);
            lastError = message;
        });
    });

    afterEach(() => {
        errors = [];
        lastError = undefined;
    });

    // ---------------------------------------------------------------------------------------------
    // Validation of scalar types
    // ---------------------------------------------------------------------------------------------

    it('should be able to validate booleans', () => {
        expect(validators.validateBoolean(null, {}, [ 'IBool' ])).toBeFalsy();
        expect(lastError).toEqual('[IBool] Expected type boolean, got type object');

        expect(validators.validateBoolean(3.14, {}, [ 'IBool' ])).toBeFalsy();
        expect(lastError).toEqual('[IBool] Expected type boolean, got type number');

        expect(validators.validateBoolean('false', {}, [ 'IBool' ])).toBeFalsy();
        expect(lastError).toEqual('[IBool] Expected type boolean, got type string');

        expect(validators.validateBoolean(true, {}, [ 'IBool' ])).toBeTruthy();
        expect(validators.validateBoolean(false, {}, [ 'IBool' ])).toBeTruthy();

        expect(validators.validateBoolean(true, { enum: [ true ] }, [ 'IBool' ])).toBeTruthy();
        expect(validators.validateBoolean(true, { enum: [ false ] }, [ 'IBool' ])).toBeFalsy();
        expect(lastError).toEqual('[IBool] Value is not included in the enumeration');

        expect(validators.validateBoolean(true, { const: true }, [ 'IBool' ])).toBeTruthy();
        expect(validators.validateBoolean(true, { const: false }, [ 'IBool' ])).toBeFalsy();
        expect(lastError).toEqual('[IBool] Value is not equal to the expected constant');
    });

    it('should be able to validate integers and numbers', () => {
        expect(validators.validateInteger(null, {}, [ 'IInteger' ])).toBeFalsy();
        expect(lastError).toEqual('[IInteger] Expected type integer, got type object');

        expect(validators.validateInteger(false, {}, [ 'IInteger' ])).toBeFalsy();
        expect(lastError).toEqual('[IInteger] Expected type integer, got type boolean');

        expect(validators.validateInteger('false', {}, [ 'IInteger' ])).toBeFalsy();
        expect(lastError).toEqual('[IInteger] Expected type integer, got type string');

        // Integers should be integral [branch]
        expect(validators.validateInteger(-9001, {}, [ 'IInteger' ])).toBeTruthy();
        expect(validators.validateInteger(-9001.5, {}, [ 'IInteger' ])).toBeFalsy();
        expect(validators.validateInteger(0, {}, [ 'IInteger' ])).toBeTruthy();
        expect(validators.validateInteger(0.5, {}, [ 'IInteger' ])).toBeFalsy();
        expect(validators.validateInteger(9001, {}, [ 'IInteger' ])).toBeTruthy();
        expect(validators.validateInteger(9001.5, {}, [ 'IInteger' ])).toBeFalsy();
        expect(lastError).toEqual('[IInteger] Value is expected to be integral');

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
        expect(lastError).toEqual('[IInteger] Value is not included in the enumeration');

        expect(validators.validateInteger(42, { const: 42 }, [ 'IInteger' ])).toBeTruthy();
        expect(validators.validateInteger(43, { const: 42 }, [ 'IInteger' ])).toBeFalsy();
        expect(lastError).toEqual('[IInteger] Value is not equal to the expected constant');

        expect(validators.validateInteger(0, { multipleOf: 3 }, [ 'IInteger' ])).toBeTruthy();
        expect(validators.validateInteger(3, { multipleOf: 3 }, [ 'IInteger' ])).toBeTruthy();
        expect(validators.validateInteger(6, { multipleOf: 3 }, [ 'IInteger' ])).toBeTruthy();
        expect(validators.validateInteger(10, { multipleOf: 3 }, [ 'IInteger' ])).toBeFalsy();
        expect(lastError).toEqual('[IInteger] Value is not a multiple of 3');

        expect(validators.validateInteger(0, { maximum: 5 }, [ 'IInteger' ])).toBeTruthy();
        expect(validators.validateInteger(5, { maximum: 5 }, [ 'IInteger' ])).toBeTruthy();
        expect(validators.validateInteger(6, { maximum: 5 }, [ 'IInteger' ])).toBeFalsy();
        expect(lastError).toEqual('[IInteger] Value is higher than 5');

        expect(validators.validateInteger(0, { exclusiveMaximum: 5 }, [ 'IInteger' ])).toBeTruthy();
        expect(validators.validateInteger(4, { exclusiveMaximum: 5 }, [ 'IInteger' ])).toBeTruthy();
        expect(validators.validateInteger(5, { exclusiveMaximum: 5 }, [ 'IInteger' ])).toBeFalsy();
        expect(lastError).toEqual('[IInteger] Value is higher than or equal to 5');

        expect(validators.validateInteger(6, { minimum: 5 }, [ 'IInteger' ])).toBeTruthy();
        expect(validators.validateInteger(5, { minimum: 5 }, [ 'IInteger' ])).toBeTruthy();
        expect(validators.validateInteger(0, { minimum: 5 }, [ 'IInteger' ])).toBeFalsy();
        expect(lastError).toEqual('[IInteger] Value is lower than 5');

        expect(validators.validateInteger(6, { exclusiveMinimum: 5 }, [ 'IInteger' ])).toBeTruthy();
        expect(validators.validateInteger(5, { exclusiveMinimum: 5 }, [ 'IInteger' ])).toBeFalsy();
        expect(lastError).toEqual('[IInteger] Value is lower than or equal to 5');
    });

    it('should be able to validate NULL values', () => {
        expect(validators.validateNull(true, {}, [ 'INull' ])).toBeFalsy();
        expect(lastError).toEqual('[INull] Expected type null, got type boolean');

        expect(validators.validateNull(3.14, {}, [ 'INull' ])).toBeFalsy();
        expect(lastError).toEqual('[INull] Expected type null, got type number');

        expect(validators.validateNull('null', {}, [ 'INull' ])).toBeFalsy();
        expect(lastError).toEqual('[INull] Expected type null, got type string');

        expect(validators.validateNull(null, {}, [ 'INull' ])).toBeTruthy();

        expect(validators.validateNull({}, {}, [ 'INull' ])).toBeFalsy();
        expect(lastError).toEqual('[INull] Value is expected to be null');
    });

    it('should be able to validate strings', () => {
        expect(validators.validateString(null, {}, [ 'IString' ])).toBeFalsy();
        expect(lastError).toEqual('[IString] Expected type string, got type object');

        expect(validators.validateString(true, {}, [ 'IString' ])).toBeFalsy();
        expect(lastError).toEqual('[IString] Expected type string, got type boolean');

        expect(validators.validateString(3.14, {}, [ 'IString' ])).toBeFalsy();
        expect(lastError).toEqual('[IString] Expected type string, got type number');

        expect(validators.validateString('', {}, [ 'IString' ])).toBeTruthy();
        expect(validators.validateString('hello world', {}, [ 'IString' ])).toBeTruthy();

        expect(validators.validateString('a', { enum: [ 'a', 'b' ] }, [ 'IString' ])).toBeTruthy();
        expect(validators.validateString('c', { enum: [ 'a', 'b' ] }, [ 'IString' ])).toBeFalsy();
        expect(lastError).toEqual('[IString] Value is not included in the enumeration');

        expect(validators.validateString('a', { const: 'a' }, [ 'IString' ])).toBeTruthy();
        expect(validators.validateString('b', { const: 'a' }, [ 'IString' ])).toBeFalsy();
        expect(lastError).toEqual('[IString] Value is not equal to the expected constant');

        expect(validators.validateString('a', { maxLength: 3 }, [ 'IString' ])).toBeTruthy();
        expect(validators.validateString('bb', { maxLength: 3 }, [ 'IString' ])).toBeTruthy();
        expect(validators.validateString('ccc', { maxLength: 3 }, [ 'IString' ])).toBeTruthy();
        expect(validators.validateString('dddd', { maxLength: 3 }, [ 'IString' ])).toBeFalsy();
        expect(lastError).toEqual('[IString] Value is longer than 3 character(s)');

        expect(validators.validateString('dddd', { minLength: 3 }, [ 'IString' ])).toBeTruthy();
        expect(validators.validateString('ccc', { minLength: 3 }, [ 'IString' ])).toBeTruthy();
        expect(validators.validateString('bb', { minLength: 3 }, [ 'IString' ])).toBeFalsy();
        expect(lastError).toEqual('[IString] Value is shorter than 3 character(s)');

        expect(validators.validateString('42', { pattern: '^\\d+$' }, [ 'IString' ])).toBeTruthy();
        expect(validators.validateString('zz', { pattern: '^\\d+$' }, [ 'IString' ])).toBeFalsy();
        expect(lastError).toEqual('[IString] Value does not match the required pattern');
    });

    // ---------------------------------------------------------------------------------------------
    // Validation of complex types
    // ---------------------------------------------------------------------------------------------

    it('should be able to validate arrays', () => {
        expect(validators.validateArray(null, {}, [ 'IArray' ])).toBeFalsy();
        expect(lastError).toEqual('[IArray] Expected type array, got type object');

        expect(validators.validateArray(true, {}, [ 'IArray' ])).toBeFalsy();
        expect(lastError).toEqual('[IArray] Expected type array, got type boolean');

        expect(validators.validateArray(3.14, {}, [ 'IArray' ])).toBeFalsy();
        expect(lastError).toEqual('[IArray] Expected type array, got type number');

        expect(validators.validateArray({}, {}, [ 'IArray' ])).toBeFalsy();
        expect(lastError).toEqual('[IArray] Expected type array, got type object');

        expect(validators.validateArray([], {}, [ 'IArray' ])).toBeTruthy();
        expect(validators.validateArray([ 1, 2, 3 ], {}, [ 'IArray' ])).toBeTruthy();

        expect(validators.validateArray([ 1 ], { maxItems: 2 }, [ 'IArray' ])).toBeTruthy();
        expect(validators.validateArray([ 1, 2 ], { maxItems: 2 }, [ 'IArray' ])).toBeTruthy();
        expect(validators.validateArray([ 1, 2, 3 ], { maxItems: 2 }, [ 'IArray' ])).toBeFalsy();
        expect(lastError).toEqual('[IArray] Value has more than 2 item(s)');

        expect(validators.validateArray([ 1, 2, 3 ], { minItems: 2 }, [ 'IArray' ])).toBeTruthy();
        expect(validators.validateArray([ 1, 2 ], { minItems: 2 }, [ 'IArray' ])).toBeTruthy();
        expect(validators.validateArray([ 1 ], { minItems: 2 }, [ 'IArray' ])).toBeFalsy();
        expect(lastError).toEqual('[IArray] Value has less than 2 item(s)');

        expect(validators.validateArray([ 1 ], { uniqueItems: false }, [ 'IArray' ])).toBeTruthy();
        expect(validators.validateArray([ 1, 2 ], { uniqueItems: false }, ['IArray'])).toBeTruthy();
        expect(validators.validateArray([ 1, 1 ], { uniqueItems: false }, ['IArray'])).toBeTruthy();
        expect(validators.validateArray([ 1 ], { uniqueItems: true }, [ 'IArray' ])).toBeTruthy();
        expect(validators.validateArray([ 1, 2 ], { uniqueItems: true }, ['IArray'])).toBeTruthy();
        expect(validators.validateArray([ 1, 1 ], { uniqueItems: true }, ['IArray'])).toBeFalsy();
        expect(lastError).toEqual('[IArray] Items in this array are expected to be unique');

        expect(validators.validateArray([ 1, 2, 3 ], { items: { type: 'number' } }, [ 'IArray' ]))
            .toBeTruthy();

        expect(validators.validateArray([ 1, 2, '3' ], { items: { type: 'number' } }, [ 'IArray' ]))
            .toBeFalsy();
        expect(lastError).toEqual('[IArray.2] Expected type integer, got type string');

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

        expect(lastError).toEqual('[IArray.2.0] Expected type boolean, got type number');

        // Neither `enum` nor `const` are implemented for arrays. Change detector tests:
        expect(validators.validateArray([], { enum: [ [ 2 ] ] }, [ 'IArray' ])).toBeTruthy();
        expect(validators.validateArray([], { const: [ 2 ] }, [ 'IArray' ])).toBeTruthy();
    });

    it('should be able to validate objects', () => {
        expect(validators.validateObject(null, {}, [ 'IObject' ])).toBeFalsy();
        expect(lastError).toEqual('[IObject] Expected type object, got type null');

        expect(validators.validateObject(true, {}, [ 'IObject' ])).toBeFalsy();
        expect(lastError).toEqual('[IObject] Expected type object, got type boolean');

        expect(validators.validateObject(3.14, {}, [ 'IObject' ])).toBeFalsy();
        expect(lastError).toEqual('[IObject] Expected type object, got type number');

        expect(validators.validateObject([], {}, [ 'IObject' ])).toBeFalsy();
        expect(lastError).toEqual('[IObject] Expected type object, got type array');

        expect(validators.validateObject({}, {}, [ 'IObject' ])).toBeTruthy();
        expect(validators.validateObject({ a: 1 }, {}, [ 'IObject' ])).toBeTruthy();

        expect(validators.validateObject({}, { maxProperties: 1 }, [ 'IObject' ])).toBeTruthy();
        expect(validators.validateObject({ a: 1 }, { maxProperties: 1 }, [ 'IObject' ]))
            .toBeTruthy();
        expect(validators.validateObject({ a: 1, b: 2 }, { maxProperties: 1 }, [ 'IObject' ]))
            .toBeFalsy();
        expect(lastError).toEqual('[IObject] Value has more than 1 properties');

        expect(validators.validateObject({ a: 1, b: 2 }, { minProperties: 1 }, [ 'IObject' ]))
            .toBeTruthy();
        expect(validators.validateObject({ a: 1 }, { minProperties: 1 }, [ 'IObject' ]))
            .toBeTruthy();
        expect(validators.validateObject({}, { minProperties: 1 }, [ 'IObject' ])).toBeFalsy();
        expect(lastError).toEqual('[IObject] Value has less than 1 properties');

        expect(validators.validateObject({ a: 1, b: 2 }, { required: ['b'] }, [ 'IObject' ]))
            .toBeTruthy();
        expect(validators.validateObject({ a: 1 }, { required: ['b'] }, [ 'IObject' ]))
            .toBeFalsy();
        expect(lastError).toEqual('[IObject] Value is expected to have property "b"');

        expect(validators.validateObject({ foo: 1 }, {
            propertyNames: { pattern: '^[a-z]+$' },
        }, [ 'IObject' ])).toBeTruthy();

        expect(validators.validateObject({ foo: 1, bar: 2 }, {
            propertyNames: { pattern: '^[a-z]+$' },
        }, [ 'IObject' ])).toBeTruthy();

        expect(validators.validateObject({ foo: 1, bar3: 2 }, {
            propertyNames: { pattern: '^[a-z]+$' },
        }, [ 'IObject' ])).toBeFalsy();
        expect(lastError).toEqual('[IObject] Value property "bar3" fails the pattern');

        expect(validators.validateObject({ a: 1 }, {
            properties: { a: { type: 'number' } }
        }, [ 'IObject' ])).toBeTruthy();

        expect(validators.validateObject({ a: 'string' }, {
            properties: { a: { type: 'number' } }
        }, [ 'IObject' ])).toBeFalsy();
        expect(lastError).toEqual('[IObject.a] Expected type integer, got type string');

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
        expect(lastError).toEqual('[IObject.d] Expected type string, got type boolean');

        expect(validators.validateObject({ a: 1, b: 2 }, {
            properties: { a: { type: 'number' } },
            additionalProperties: true,
        }, [ 'IObject' ])).toBeTruthy();

        expect(validators.validateObject({ a: 1, b: 2 }, {
            properties: { a: { type: 'number' } },
            additionalProperties: false,
        }, [ 'IObject' ])).toBeFalsy();
        expect(lastError).toEqual('[IObject] Value includes unevaluated properties');

        expect(validators.validateObject({ a: 1, foobar: 2 }, {
            patternProperties: { '^[a-z]$': { type: 'number' } },
            additionalProperties: false,
        }, [ 'IObject' ])).toBeFalsy();
        expect(lastError).toEqual('[IObject] Value includes unevaluated properties');

        // Neither `enum` nor `const` are implemented for objects. Change detector tests:
        expect(validators.validateObject({}, { enum: [ { a: 1 } ] }, [ 'IObject' ])).toBeTruthy();
        expect(validators.validateObject({}, { const: { a: 1 } }, [ 'IObject' ])).toBeTruthy();
    });
});
