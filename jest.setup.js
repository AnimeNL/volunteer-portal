// Copyright 2021 Peter Beverloo & AnimeCon. All rights reserved.
// Use of this source code is governed by a MIT license that can be
// found in the LICENSE file.

// Enables the fetch() function to be used in scripts. Default responses are provided for each of
// the key API calls to enable tests to access these in functions.
require('jest-fetch-mock').enableMocks();

// Enables IndexedDB to be used in Jest tests, which we depend on for caching.
require('fake-indexeddb/auto');
