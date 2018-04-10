import {EnvConfig} from '../../config/env';

const mongoose = require('mongoose');
mongoose.Promise = Promise;

export let db = mongoose.createConnection(EnvConfig.MONGO_DB);
export let userSchema = new mongoose.Schema({
    chatId: String,
    number: String,
    name: String
});

export let User = db.model('user', userSchema, 'users');
