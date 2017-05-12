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
    tags: [String],
    created: {
        type: Date,
        default: Date.now
    },
    location: {
        type: {
            type: String,
            default: 'Point'
        },
        coordinates: [{
            type: Number,
            required: 'You must supply coordinates'
        }],
        address: {
            type: String,
            required: 'You must supply an address!'
        }
    }

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