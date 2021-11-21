// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import { Schema } from 'ts-json-schema-generator';

import api from '../api/schema.json';

// Provides the ability to validate an arbirary object, given as |impact| & often received from the
// cache or network, according to the syntax set by one of the volunteer portal's APIs, given as
// the |inputApi|. Validation is done based on a predetermined schema, checked in to the source
// tree as a JSON file.
//
// For future reference, it may seem like Ajv or similar tools would've been a good option to use
// here, however, including such libraries add at least ~40 KiB to the compressed size of our
// JavaScript library. As such, an internal implementation is used instead.
export function validate<T>(input: any, inputApi: keyof typeof api.definitions): input is T {
    if (!Object.prototype.hasOwnProperty.call(api.definitions, inputApi)) {
        console.warn(`Unable to validate definitionless type: ${inputApi}.`);
        return false;
    }

    return validateAny(input, api.definitions[inputApi] as Schema, [ inputApi ]);
}

// -------------------------------------------------------------------------------------------------
// Internal functionality that should not be accessed directly.
// -------------------------------------------------------------------------------------------------

// Common error messages shared by multiple validators.
const kInvalidConstValue = 'Value is not equal to the expected constant';
const kInvalidEnumValue = 'Value is not included in the enumeration';

// Prefix used to indicate local type references in the schema output.
const kLocalReferencePrefix = '#/definitions/';

// Reports the given |message| as an error, which was found at the given |path|. The boolean FALSE
// will be returned, to indicate that validation could not be completed due to this issue.
function reportError(message: string, path: string[], context: any): false {
    console.error(`[${path.join('.')}] ${message}`, context);
    return false;
}

// Validates whehter the given |input| is valid in accordance to the |schema|, whose expected type
// has not been considered by the caller of this method. Schemas have the ability to refer to other
// types, which has been implemented as part of this function.
function validateAny(input: any, schema: Schema, path: string[]): input is any {
    if (schema.hasOwnProperty('$ref')) {
        const reference = schema.$ref!;
        if (!reference.startsWith(kLocalReferencePrefix))
            return reportError(`Reference ${reference} is not local to the schema`, path, input);

        const referenceType = reference.substring(kLocalReferencePrefix.length);
        if (!Object.prototype.hasOwnProperty.call(api.definitions, referenceType))
            return reportError(`Reference ${referenceType} is not known to the API`, path, input);

        schema = ((api.definitions as any)[referenceType]) as Schema;
    }

    switch (schema.type) {
        case 'array':
            return validateArray(input, schema, path);
        case 'boolean':
            return validateBoolean(input, schema, path);
        case 'integer':
            return validateNumeric(input, schema, path, /* integer= */ true);
        case 'null':
            return validateNull(input, schema, path);
        case 'number':
            return validateNumeric(input, schema, path, /* integer= */ false);
        case 'object':
            return validateObject(input, schema, path);
        case 'string':
            return validateString(input, schema, path);
    }

    return reportError(`Invalid type given (${schema.type})`, path, input);
}

// Validates that the given |input| is an array, considering a few options from |schema| as per the
// draft-handrews-json-schema-validation-01 specification.
function validateArray(input: any, schema: Schema, path: string[]): input is any[] {
    if (typeof input !== 'object' || !Array.isArray(input))
        return reportError(`Expected type array, got type ${typeof input}`, path, input);

    // https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-6.1
    // TODO: Both `enum` and `const` would require having some deepEqual function as opposed to
    // (strict) instance comparison, does it make sense to compare that?

    // https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-6.4
    if (schema.maxItems !== undefined && input.length > schema.maxItems)
        return reportError(`Value has more than ${schema.maxItems} item(s)`, path, input);

    if (schema.minItems !== undefined && input.length < schema.minItems)
        return reportError(`Value has less than ${schema.minItems} item(s)`, path, input);

    if (schema.uniqueItems !== undefined && schema.uniqueItems &&
            input.length !== (new Set([...input])).size) {
        return reportError('Items in this array are expected to be unique', path, input);
    }

    // TODO: Supporting `contains`, `maxContains` and `minContains` from the draft would be good,
    // but the JSON schema generator we use doesn't emit them at the moment.

    // https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-00#section-10.3.1.2
    // https://datatracker.ietf.org/doc/html/draft-handrews-json-schema-validation-01#section-6.4
    //
    // Note that array values for `items` were renamed to `prefixItems` in a later draft, but the
    // TypeScript schema that is being imported doesn't support that yet.
    if (schema.items !== undefined && Array.isArray(schema.items)) {
        if (input.length !== schema.items.length)
            return reportError(`Expected ${schema.items.length} items in this array`, path, input);

        for (let index = 0; index < schema.items.length; ++index) {
            if (!validateAny(input[index], schema.items[index] as Schema, [ ...path, `${index}` ]))
                return false;
        }
    }

    if (schema.items !== undefined && !Array.isArray(schema.items)) {
        for (let index = 0; index < input.length; ++index) {
            if (!validateAny(input[index], schema.items as Schema, [ ...path, `${index}` ]))
                return false;
        }
    }

    return true;
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
    if (typeof input !== 'object')
        return reportError(`Expected type object, got type ${typeof input}`, path, input);

    if (input === null)
        return reportError('Expected type object, got type null', path, input);

    if (Array.isArray(input))
        return reportError('Expected type object, got type array', path, input);

    // https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-6.1
    // TODO: Both `enum` and `const` would require having some deepEqual function as opposed to
    // (strict) instance comparison, does it make sense to compare that?

    const properties = Object.getOwnPropertyNames(input);

    // https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-6.5
    if (schema.maxProperties !== undefined && properties.length > schema.maxProperties)
        return reportError(`Value has more than ${schema.maxProperties} properties`, path, input);

    if (schema.minProperties !== undefined && properties.length < schema.minProperties)
        return reportError(`Value has less than ${schema.minProperties} properties`, path, input);

    if (Array.isArray(schema.required)) {
        for (const key of schema.required) {
            if (!input.hasOwnProperty(key))
                return reportError(`Value is expected to have property "${key}"`, path, input);
        }
    }

    // TODO: Implement `dependentRequired`, which is easy enough, but missing in the TypeScript
    // definitions of the JSON scheme creation dependency that we're using.

    // https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-00#section-10.3.2
    const unevaluatedProperties = new Set(properties);

    if (schema.patternProperties !== undefined) {
        for (const [ pattern, patternSchema ] of Object.entries(schema.patternProperties)) {
            const expression = new RegExp(pattern);

            for (const property of unevaluatedProperties) {
                if (!expression.test(property))
                    continue;

                unevaluatedProperties.delete(property);
                if (!input.hasOwnProperty(property))
                    continue;

                if (!validateAny(input[property], patternSchema as Schema, [ ...path, property ]))
                    return false;
            }
        }
    }

    if (schema.properties !== undefined) {
        for (const [ property, propertySchema ] of Object.entries(schema.properties)) {
            unevaluatedProperties.delete(property);
            if (!input.hasOwnProperty(property))
                continue;

            if (!validateAny(input[property], propertySchema as Schema, [ ...path, property ]))
                return false;
        }
    }

    if (schema.additionalProperties !== undefined) {
        if (schema.additionalProperties === false && unevaluatedProperties.size > 0)
            return reportError('Value includes unevaluated properties', path, input);

        if (typeof schema.additionalProperties === 'object') {
            const propertySchema = schema.additionalProperties as Schema;
            for (const property of unevaluatedProperties) {
                if (!validateAny(input[property], propertySchema, [ ...path, property ]))
                    return false;
            }
        }
    }

    if (schema.propertyNames !== undefined && schema.propertyNames.hasOwnProperty('pattern')) {
        const expression = new RegExp((schema.propertyNames as Schema).pattern!);
        for (const property of properties) {
            if (!expression.test(property))
                return reportError(`Value property "${property}" fails the pattern`, path, input);
        }
    }

    return true;
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
    validateArray,
    validateBoolean,
    validateInteger,
    validateNull,
    validateNumber,
    validateObject,
    validateString,
};
