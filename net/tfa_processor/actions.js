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

const _getAddressStateValue = (possibleAddressValues, address) => {
    let stateValueRep = possibleAddressValues[address]
    let stateValue;
    if (stateValueRep && stateValueRep.length > 0) {
        stateValue = cbor.decode(stateValueRep)
    }
    return stateValue;
}

/**
 * Register User
 *
 * @param context
 * @param address
 * @param user
 * @returns {function(*=)}
 * @private
 */
const _create = (context, address, user) => (possibleAddressValues) => {
    let stateValue = _getAddressStateValue(possibleAddressValues, address)
    if (stateValue) {
        throw new InvalidTransaction(
            `User with uin ${user.Uin} and phone number ${user.PhoneNumber} already in state`
        )
    }

    stateValue = user

    return _setEntry(context, address, stateValue)
}

/**
 * Update User
 *
 * @param context
 * @param address
 * @param payloadUser
 * @returns {function(*=)}
 * @private
 */
const _update = (context, address, payloadUser) => (possibleAddressValues) => {

    let stateUser = _getAddressStateValue(possibleAddressValues, address)
    if (!stateUser) {
        throw new InvalidTransaction(
            `User data is empty. Run register first.`
        )
    }

    if (stateUser.Uin !== payloadUser.Uin) {
        throw new InvalidTransaction(
            `User uin can not be changed - register user with new uin address`
        )
    }

    if (stateUser.PhoneNumber !== payloadUser.PhoneNumber) {
        throw new InvalidTransaction(
            `User phone number can not be changed - register user with new phone number address`
        )
    }

    stateUser.Name = payloadUser.Name
    stateUser.Email = payloadUser.Email
    stateUser.Sex = payloadUser.Sex
    stateUser.Birthdate = payloadUser.Birthdate

    return _setEntry(context, address, stateUser)
}

/**
 * Set User push token
 *
 * @param context
 * @param address
 * @param pushToken
 * @returns {function(*)}
 * @private
 */
const _setPushToken = (context, address, pushToken) => (possibleAddressValues) => {
    let stateUser = _getAddressStateValue(possibleAddressValues, address)
    if (!stateUser) {
        throw new InvalidTransaction(
            `User data is empty. Run register first.`
        )
    }

    stateValue.PushToken = pushToken

    return _setEntry(context, address, stateValue)
}
/**
 * Set User push token
 *
 * @param context
 * @param address
 * @returns {function(*)}
 * @private
 */
const _isVerified = (context, address) => (possibleAddressValues) => {
    let stateUser = _getAddressStateValue(possibleAddressValues, address)
    if (!stateUser) {
        throw new InvalidTransaction(`User data is empty. Run register first.`)
    }

    stateValue.IsVerified = true

    return _setEntry(context, address, stateValue)
}

/**
 * Delete user
 *
 * @param context
 * @param address
 * @returns {function(*)}
 * @private
 */
const _delete = (context, address) => (possibleAddressValues) => {
    let stateUser = _getAddressStateValue(possibleAddressValues, address)
    if (!stateUser) {
        throw new InvalidTransaction(`User data is empty.`)
    }

    return context.deleteState([address])
}

module.exports.create = _create;
module.exports.delete = _delete;
module.exports.setEntry = _setEntry;
module.exports.update = _update;
module.exports.setPushToken = _setPushToken;
module.exports.isVerified = _isVerified;