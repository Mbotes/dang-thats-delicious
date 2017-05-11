const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const slug = require('slugs');

const storeSchema = mongoose.Schema({
    name: {
        type: String,
        trim: true,
        require: 'Please enter a name'
    },
    slug: String,
    description: {
        type: String,
        trim: true
    },
    tags: [String]

});

storeSchema.pre('save', function(next) {
    if(!this.isModified('name')) {
        next(); //skip it !
        return; //stop function from running!
    }
    this.slug = slug(this.name);
    next();

    //TODO to make slugs more resilient so that they are more unique
});

module.exports = mongoose.model('Store', storeSchema);