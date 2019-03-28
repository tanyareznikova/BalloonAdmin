//Отзывы о товаре

var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var ReviewSchema = new Schema(
    {

        name: {type: String, required: true, trim: true},
        message: {type: String, required: true, trim: true},
        productID: {type: String, required: true}

    },
    //{ _id: false },
    {timestamps: true}
);

//Export model
module.exports = mongoose.model('Review', ReviewSchema);
