//Товар

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ProductSchema = new Schema(
    {

        imgUrl: {type: String},
        title: {type: String, required: true, trim: true, index: true},
        description: {type: String, required: true},
        attribute: {type: String, required: true},
        price: {type: String, required: true},
        link: {type: String},
        isSaved: {type: Boolean, default: false},
        buttonStatus: { type: String, default: " Сохранить " },
        productCategories: [{type: Schema.Types.ObjectId, ref: "Category"}],
        productReviews: [{type: Schema.Types.ObjectId, ref: "Review"}]

    },
    //{ _id: false },
    {timestamps: true}
);

//Export model
module.exports = mongoose.model('Product', ProductSchema);
