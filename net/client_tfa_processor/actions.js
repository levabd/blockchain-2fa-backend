const cbor = require('cbor')
const CRC16 = require('crc16');
const {
    InvalidTransaction
} = require('sawtooth-sdk/processor/exceptions')

const log_statuses = {
    SEND_CODE: 'SEND_CODE',
    RESEND_CODE: 'RESEND_CODE',
    INVALID: 'INVALID',
    VALID: 'VALID',
    EXPIRED: 'EXPIRED',
}

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

    stateUser.PhoneNumber = payloadUser.PhoneNumber
    stateUser.Name = payloadUser.Name
    stateUser.Email = payloadUser.Email
    stateUser.Sex = payloadUser.Sex
    stateUser.Birthdate = payloadUser.Birthdate
    stateUser.Region = payloadUser.Region
    stateUser.PersonalAccount = payloadUser.PersonalAccount
    stateUser.Question = payloadUser.Question
    stateUser.Answer = payloadUser.Answer
    stateUser.AdditionalData = payloadUser.AdditionalData

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

const hexdec = (hexString) => {
    hexString = (hexString + '').replace(/[^a-f0-9]/gi, '')
    return parseInt(hexString, 16)
}

const sortNumber = (a, b) => {
    return a - b;
}

const _getLatestIndex = (indexes) => {
    indexes.sort(sortNumber);
    return indexes[indexes.length - 1]
}

/**
 * Append log event to user
 *
 * @param context
 * @param address
 * @param data
 * @returns {function(*)}
 * @private
 */
const _addLog = (context, address, data) => (possibleAddressValues) => {
    let stateUser = _getAddressStateValue(possibleAddressValues, address)
    const log = data.Log
    const phoneNumber = data.PhoneNumber
    let logKeys = Object.keys(stateUser.Logs)
    let indexKey = 0

    if (!stateUser) {
        throw new InvalidTransaction(`User data is empty.`)
    }

    if (!stateUser.Logs) {
        stateUser.Logs = {}
    }

    if (logKeys.length !== 0) {
        indexKey = _getLatestIndex(logKeys)
    }

    log.Code = hexdec(CRC16(process.env['TRANSACTION_FAMILY_KEY'] + log.Event + phoneNumber + log.ActionTime))

    if (log.Code.Status && log.Code.Status === log_statuses.RESEND_CODE) {
        log.Code.Status = log_statuses.RESEND_CODE
    } else {
        log.Code.Status = log_statuses.SEND_CODE
    }

    stateUser.Logs[parseInt(indexKey, 10)] = log;

    return _setEntry(context, address, stateValue)
}

/**
 * Verify that the given code is correct
 *
 * @param context
 * @param address
 * @param data
 * @returns {function(*)}
 * @private
 */
const _verify = (context, address, data) => (possibleAddressValues) => {
    let stateUser = _getAddressStateValue(possibleAddressValues, address)
    if (!stateUser) {
        throw new InvalidTransaction(`User data is empty.`)
    }

    if (!stateUser.Logs) {
        throw new InvalidTransaction(`User does not has Logs.`)
    }

    let sendCodelogKeys = Object.keys(stateUser.Logs)
    let filteredLogsArray = {}
    sendCodelogKeys.forEach(logIndex => {
        if (stateUser.Logs[logIndex] &&
            stateUser.Logs[logIndex].Status &&
            stateUser.Logs[logIndex].Status === log_statuses.SEND_CODE ||
            stateUser.Logs[logIndex].Status === log_statuses.RESEND_CODE) {
            filteredLogsArray[logIndex] = stateUser.Logs[logIndex]
        }
    })

    sendCodelogKeys = Object.keys(filteredLogsArray)

    const indexKey = _getLatestIndex(sendCodelogKeys)
    const latestLogWithSendCode = filteredLogsArray[indexKey]

    let requestLog = data.Log
    if (latestLogWithSendCode.ExpiredAt >= requestLog.ActionTime) {
        requestLog.Status = log_statuses.EXPIRED;
    } else if (parseInt(latestLogWithSendCode.Code, 10) === parseInt(requestLog.Code, 10)) {
        requestLog.Status = log_statuses.VALID;
    } else {
        requestLog.Status = log_statuses.INVALID;
    }

    stateUser.Logs[parseInt(indexKey, 10) + 1] = requestLog;

    return _setEntry(context, address, stateValue)
}

module.exports.create = _create;
module.exports.delete = _delete;
module.exports.setEntry = _setEntry;
module.exports.verify = _verify;
module.exports.update = _update;
module.exports.setPushToken = _setPushToken;
module.exports.addLog = _addLog;