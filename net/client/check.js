const {createContext, CryptoFactory} = require('sawtooth-sdk/signing')

const context = createContext('secp256k1')
const privateKey = context.newRandomPrivateKey()
const signer = new CryptoFactory(context).newSigner(privateKey)
const cbor = require('cbor')
const protobuf = require('protobufjs')

const atob = require('atob');
const btoa = require('btoa');
const {
    InternalError
} = require('sawtooth-sdk/processor/exceptions')

const request = require('request')
const encode = obj => Buffer.from(JSON.stringify(obj, Object.keys(obj).sort()))
const decode = buf => JSON.parse(buf.toString())

request.get({
    url: 'http://127.0.0.1:8008/state/5f1db925cbeba3d87aca57d579994ad2baf4a77e83939da422093fa8547bcfefb972e0',
    headers: {'Content-Type': 'application/octet-stream'}
}, (err, response) => {
    if (err) return console.log(err)
   
    var dataBase64 = JSON.parse(response.body).data
    const buffer = new Buffer(dataBase64, 'base64')
    const decoded = decode(buffer);
    console.log(decoded);
});


