// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

import type { IApplication } from '../api/IApplication';
import type { IAuth } from '../api/IAuth';
import type { IAvatar } from '../api/IAvatar';
import type { IContent } from '../api/IContent';
import type { IEnvironment } from '../api/IEnvironment';
import type { IEvent } from '../api/IEvent';
import type { INardo } from '../api/INardo';
import type { INotes } from '../api/INotes';
import type { IUser } from '../api/IUser';

import type api from '../api/schema.json';

// Full, unfiltered list of types known in the API. The ApiValidator infrastructure is able to
// validate all structures that are known to this type definition.
export type ApiType = keyof typeof api.definitions;

// Internal filters used to remove specific names from the list of API types, to reduce this down to
// a list of API names. We require a prefix ("I"), and want to drop entries containing either
// "Request" or "Response" in their name, as they represent types rather than individual APIs.
type Contains<Set, K extends string> = Set extends `${infer a}${K}${infer b}` ? Set : never;
type HasPrefix<Set, K extends string> = Set extends `${K}${infer _}` ? never : Set;
type HasSuffix<Set, K extends string> = Set extends `${infer _}${K}` ? Set : never;

// Type definition for the API names that are available in the generated schema for the volunteer
// portal application. Names that don't start with an "I" or have either "Request" or "Response" in
// them will be filtered out, to restrict this type to top-level APIs.
export type ApiName = Exclude<ApiType, HasPrefix<ApiType, 'I'> |
                                       HasSuffix<ApiType, 'Request'> |
                                       HasSuffix<ApiType, 'Response'> |
                                       Contains<ApiType, 'Request'> |
                                       Contains<ApiType, 'Response'>>;

// Type mappings from string values to TypeScript types. Used to resolve typing information from
// string identifiers passed to the ApiRequest<> and ApiRequestManager<> constructors.
interface ApiTypeMapping {
    IApplication: IApplication;
    IAuth: IAuth;
    IAvatar: IAvatar;
    IContent: IContent;
    IEnvironment: IEnvironment;
    IEvent: IEvent;
    INardo: INardo;
    INotes: INotes;
    IUser: IUser;
}

// Type request and response types of API calls is based on the input type, which defines both
// pieces of information. Validation is automatically applied based on the textual name.
export type ApiRequestType<T extends keyof ApiTypeMapping> =
    ApiTypeMapping[T] extends { request: unknown } ? ApiTypeMapping[T]['request'] : void;

export type ApiResponseType<T extends keyof ApiTypeMapping> =
    ApiTypeMapping[T] extends { response: unknown } ? ApiTypeMapping[T]['response'] : undefined;

// Automatically verify that the API type mappings in |ApiTypeMappings| are complete, and that no
// extra values are included in the interface either, when compared against the |ApiName| enum.
type ApiTypeMappingIsComplete = Exclude<ApiName, keyof ApiTypeMapping>;
type ApiTypeMappingIsRestrained = {
    [K in keyof ApiTypeMapping]: Extract<ApiName, K> extends never
        ? K : never }[keyof ApiTypeMapping];

type Verify<Missing extends never = ApiTypeMappingIsComplete,
            Extra extends never = ApiTypeMappingIsRestrained> = 0;
