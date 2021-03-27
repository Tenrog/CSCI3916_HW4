var mongoose = require('mongoose');
var Schema = mongoose.Schema;
mongoose.Promise = global.Promise;

try {
    mongoose.connect( process.env.DB, {useNewUrlParser: true, useUnifiedTopology: true}, () =>
        console.log("connected"));
}catch (error) {
    console.log("could not connect");
}


mongoose.set('useCreateIndex', true);


//Review schema
var ReviewSchema = new Schema({
    reviewer: { type: String, required: true, unique: false},
    movie: { type: String, required: true, unique: false},
    comment: { type: String, required: true, unique: false},
    rating: { type: Number, required: true, unique: false}
});

module.exports = mongoose.model('Review', ReviewSchema);