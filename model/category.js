//Категория

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var CategorySchema = new Schema(
    {
        categoryTitle: {type: String, required: true, trim: true},
        categoryLink: {type: String, required: true, trim: true, unique:true},
        productID: {type: String, required: true}
    },
    //{ _id: false },
    //{unique:true},
    {timestamps: true}
);

//Export model
module.exports = mongoose.model('Category', CategorySchema);
