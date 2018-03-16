const crypto = require('crypto')

export const _hash = (x) => crypto.createHash('sha512').update(x).digest('hex').toLowerCase()
