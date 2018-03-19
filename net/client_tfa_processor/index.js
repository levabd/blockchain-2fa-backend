/**
 * Copyright 2016 Intel Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ------------------------------------------------------------------------------
 */
'use strict';

console.log('start transaction processor')

const endOfLine = require('os').EOL;

if (process.argv.length < 5) {
    console.log('There is must be 3 arguments in order to run this command correctly: ' + endOfLine +
        '1. A validator address' + endOfLine +
        '2. Transaction family name' + endOfLine +
        '3. Transaction family version' + endOfLine)
    process.exit(1)
}

// 'tcp://0.0.0.0:4004'
const address = process.argv[2]
process.env['TRANSACTION_FAMILY_KEY'] = process.argv[3]
process.env['TRANSACTION_FAMILY_VERSION'] = process.argv[4]

const {TransactionProcessor} = require('sawtooth-sdk/processor');
const IntegerKeyHandler = require('./handler');
const transactionProcessor = new TransactionProcessor(address);
transactionProcessor.addHandler(new IntegerKeyHandler());
transactionProcessor.start();
