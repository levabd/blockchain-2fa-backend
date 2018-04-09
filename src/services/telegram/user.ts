const config = require('./config');
const mongoose = require('mongoose');
mongoose.Promise = Promise;

export let db = mongoose.createConnection(config.db);
export let userSchema = new mongoose.Schema({
    chatId: String,
    number: String,
    name: String
});

export let User = db.model('user', userSchema);
