'use strict'

const {TransactionHandler} = require('sawtooth-sdk/processor/handler')
const {
    InvalidTransaction,
    InternalError
} = require('sawtooth-sdk/processor/exceptions')
const cbor = require('cbor')
const actions = require('./actions')
const helpers = require('./helpers')
const validator = require('./validator')

class IntegerKeyHandler extends TransactionHandler {
    constructor() {
        super(process.env['TRANSACTION_FAMILY_KEY'], [process.env['TRANSACTION_FAMILY_VERSION']], [helpers.INT_KEY_NAMESPACE])
    }

    apply(transactionProcessRequest, context) {
        return helpers.decodeCbor(transactionProcessRequest.payload)
            .catch(helpers.toInternalError)
            .then((data) => {

                // Minimal validation
                let action = data.Action
                if (!action) {
                    throw new InvalidTransaction('Action is required')
                }

                let phoneNumber = data.PhoneNumber
                if (phoneNumber === null || phoneNumber === undefined) {
                    throw new InvalidTransaction('PhoneNumber is required')
                }

                if (typeof(phoneNumber) !== 'string') {
                    throw new InvalidTransaction('PhoneNumber must be a string')
                }

                let found = phoneNumber.match(/^\+?[1-9]\d{1,14}$/);
                if (!found) {
                    throw new InvalidTransaction('PhoneNumber has invalid format')
                }

                let _applyAction;
                let _applyData;
                let errors;

                switch (action) {
                    case 'create':
                        errors = validator.getUserValidationErrors(data.User)
                        if (errors && errors.length) {
                            throw new InvalidTransaction(JSON.stringify(errors))
                        }
                        _applyAction = actions.create
                        _applyData = data.User
                        break;
                    case 'update':
                        errors = validator.getUserValidationErrors(data.User)
                        if (errors && errors.length) {
                            throw new InvalidTransaction(JSON.stringify(errors))
                        }
                        _applyAction = actions.update
                        _applyData = data.User
                        break;
                    case 'delete':
                        _applyAction = actions.delete
                        _applyData = null
                        break;
                    case 'addLog':
                        if (!data.Log) {
                            throw new InvalidTransaction('Payload does not contain Log model')
                        }
                        errors = validator.getLogValidationErrors(data.Log)
                        if (errors && errors.length) {
                            throw new InvalidTransaction(JSON.stringify(errors))
                        }
                        _applyAction = actions.addLog
                        _applyData = {Log: data.Log, PhoneNumber: phoneNumber}
                        break;
                    case 'varify':
                        if (!data.Log) {
                            throw new InvalidTransaction('Payload does not contain Log model')
                        }
                        errors = validator.getLogValidationErrors(data.Log, true)
                        if (errors && errors.length) {
                            throw new InvalidTransaction(JSON.stringify(errors))
                        }

                        _applyAction = actions.verify
                        _applyData = {Log: data.Log, PhoneNumber: phoneNumber}
                        break;
                    case 'setPushToken':
                        _applyAction = actions.setPushToken
                        _applyData = data.PushToken
                        break;
                    default:
                        throw new InvalidTransaction(
                            `Verb must be register, update, setPushToken ot isVerified: not ${action}`
                        )
                }

                const address = helpers.getAddress(phoneNumber)

                // Get the current state, for the key's address:
                let getPromise = context.getState([address])

                // Apply the action to the promise's result:
                let actionPromise = getPromise.then(
                    _applyAction(context, address, _applyData)
                )

                // Validate that the action promise results in the correctly set address:
                return actionPromise.then(addresses => {
                    if (addresses.length === 0) {
                        throw new InternalError('State Error!')
                    }
                })
            });
    }
}

module.exports = IntegerKeyHandler
