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

'use strict'

const {TransactionHandler} = require('sawtooth-sdk/processor/handler')
const {
    InvalidTransaction,
    InternalError
} = require('sawtooth-sdk/processor/exceptions')
const crypto = require('crypto')
const cbor = require('cbor')
// Constants defined in intkey specification
const MIN_VALUE = 99999999999
const MAX_VALUE = 4294967295001
const MAX_NAME_LENGTH = 20
const INT_KEY_FAMILY = 'tfa'
const _hash = (x) => crypto.createHash('sha512').update(x).digest('hex').toLowerCase()
const INT_KEY_NAMESPACE = _hash(INT_KEY_FAMILY).substring(0, 6)

const _decodeCbor = (buffer) => new Promise((resolve, reject) =>
    cbor.decodeFirst(buffer, (err, obj) => (err ? reject(err) : resolve(obj)))
)

const _toInternalError = (err) => {
    let message = (err.message) ? err.message : err
    throw new InternalError(message)
}

const _setEntry = (context, address, stateValue) => {
    let entries = {
        [address]: cbor.encode(stateValue)
    }
    return context.setState(entries)
}


const _applyRegister = (context, address, user) => (possibleAddressValues) => {

    let stateValueRep = possibleAddressValues[address]
    let stateValue;
    if (stateValueRep && stateValueRep.length > 0) {
        stateValue = cbor.decode(stateValueRep)
    }

    // 'set' passes checks so store it in the state
    if (stateValue){
        console.log(`User with uin ${user.Uin} and phone number ${user.PhoneNumber} already in state`)
    }

    if (!stateValue) {
        stateValue = {}
    }

    stateValue = user

    return _setEntry(context, address, stateValue)
}

class IntegerKeyHandler extends TransactionHandler {
    constructor() {
        super(INT_KEY_FAMILY, ['0.1'], [INT_KEY_NAMESPACE])
    }

    apply(transactionProcessRequest, context) {
        return _decodeCbor(transactionProcessRequest.payload)
            .catch(_toInternalError)
            .then((data) => {
                let action = data.Verb
                if (!action) {
                    throw new InvalidTransaction('Verb is required')
                }

                // Validate the update
                let name = data.User.Name
                if (!name) {
                    throw new InvalidTransaction('Name is required')
                }

                if (name.length > MAX_NAME_LENGTH) {
                    throw new InvalidTransaction(
                        `Name must be a string of no more than ${MAX_NAME_LENGTH} characters`
                    )
                }

                let uin = data.User.Uin
                if (uin === null || uin === undefined) {
                    throw new InvalidTransaction('Uin is required')
                }

                let phoneNumber = data.User.PhoneNumber
                if (phoneNumber === null || phoneNumber === undefined) {
                    throw new InvalidTransaction('PhoneNumber is required')
                }

                let parsed = parseInt(uin)
                if (parsed !== uin || parsed < MIN_VALUE || parsed > MAX_VALUE) {
                    throw new InvalidTransaction(
                        `Value must be an integer ` +
                        `no less than ${MIN_VALUE} and ` +
                        `no greater than ${MAX_VALUE}`)
                }

                uin = parsed;

                // Determine the action to apply based on the verb
                let actionFn;

                if (action === 'register') {
                    actionFn = _applyRegister
                } else if (action === 'dec') {
                    actionFn = _applyDec
                } else if (action === 'inc') {
                    actionFn = _applyInc
                } else {
                    throw new InvalidTransaction(`Verb must be set, inc, dec not ${action}`)
                }

                const uinPart = _hash(uin.toString()).slice(-32)
                const phoneNumberPart = _hash(phoneNumber.toString()).slice(-32)

                let address = INT_KEY_NAMESPACE + uinPart + phoneNumberPart

                // Get the current state, for the key's address:
                let getPromise = context.getState([address])

                // Apply the action to the promise's result:
                let actionPromise = getPromise.then(
                    actionFn(context, address, data.User)
                )

                // Validate that the action promise results in the correctly set address:
                return actionPromise.then(addresses => {
                    if (addresses.length === 0) {
                        throw new InternalError('State Error!')
                    }
                    console.log(`Write user with name: ${data.User.Name}`)
                })
            });
    }
}

module.exports = IntegerKeyHandler
