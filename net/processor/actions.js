const cbor = require('cbor')
const validator = require('./validator')
const {
    InvalidTransaction
} = require('sawtooth-sdk/processor/exceptions')

const _setEntry = (context, address, stateValue) => {
    let entries = {
        [address]: cbor.encode(stateValue)
    }
    return context.setState(entries)
}

const _register = (context, address, user) => (possibleAddressValues) => {

    let stateValueRep = possibleAddressValues[address]
    let stateValue;
    if (stateValueRep && stateValueRep.length > 0) {
        stateValue = cbor.decode(stateValueRep)
    }

    // 'set' passes checks so store it in the state
    if (stateValue) {
        throw new InvalidTransaction(
            `User with uin ${user.Uin} and phone number ${user.PhoneNumber} already in state`
        )
    }

    if (!stateValue) {
        stateValue = user
    }

    return _setEntry(context, address, stateValue)
}

const _update = (context, address, user) => (possibleAddressValues) => {

    let stateValueRep = possibleAddressValues[address]
    let stateValue;
    if (stateValueRep && stateValueRep.length > 0) {
        stateValue = cbor.decode(stateValueRep)
    }

    // 'set' passes checks so store it in the state
    if (stateValue) {
        console.log(`User with uin ${user.Uin} and phone number ${user.PhoneNumber} already in state`)
    }

    if (!stateValue) {
        stateValue = {}
    }

    stateValue = user

    return _setEntry(context, address, stateValue)
}

const _setPushToken = (context, address, user) => (possibleAddressValues) => {

    let stateValueRep = possibleAddressValues[address]
    let stateValue;
    if (stateValueRep && stateValueRep.length > 0) {
        stateValue = cbor.decode(stateValueRep)
    }

    // 'set' passes checks so store it in the state
    if (stateValue) {
        console.log(`User with uin ${user.Uin} and phone number ${user.PhoneNumber} already in state`)
    }

    if (!stateValue) {
        stateValue = {}
    }

    stateValue = user

    return _setEntry(context, address, stateValue)
}

module.exports.register = _register;
module.exports.setEntry = _setEntry;
module.exports.update = _update;
module.exports.setPushToken = _setPushToken;