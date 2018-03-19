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
        super(helpers.INT_KEY_FAMILY, ['0.1'], [helpers.INT_KEY_NAMESPACE])
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

                let uin = data.Uin
                if (uin === null || uin === undefined) {
                    throw new InvalidTransaction('Uin is required')
                }
                const uinAsStr = `${uin}`
                if (uinAsStr.length !== 12) {
                    throw new InvalidTransaction(`Uin length must be 12. ${uinAsStr.length} given.`)
                }

                found = uinAsStr.match(/[0-9]{12}/);
                if (!found) {
                    throw new InvalidTransaction('Uin has invalid format')
                }

                let parsedUid = parseInt(uin)
                if (parsedUid !== uin) {
                    throw new InvalidTransaction(`Value must be an integer `)
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
                    case 'setPushToken':
                        _applyAction = actions.setPushToken
                        _applyData = data.PushToken
                        break;
                    case 'isVerified':
                        _applyAction = actions.isVerified
                        _applyData = null
                        break;
                    default:
                        throw new InvalidTransaction(
                            `Verb must be register, update, setPushToken ot isVerified: not ${action}`
                        )
                }

                const address = helpers.getAddress(parsedUid, phoneNumber)

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
