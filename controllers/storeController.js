const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const multer = require('multer');
const jimp = require('jimp');
const uuid = require('uuid');
const multerOptions = {
    storage: multer.memoryStorage(),
    fileFilter(req, file, next) {
        const isPhoto = file.mimetype.startsWith('image/');
        if(isPhoto) {
            next(null, true);
        } else {
            next({ message: 'that fileType isn\'t allowed!'}, false);
        }
    }
};

exports.homePage = (req, res) => {
    res.render('index', {title: 'Dang!'});
};

exports.addStore = (req, res) => {
    res.render('editStore', {title: 'Add Store'});
};

exports.upload = multer(multerOptions).single('photo');

exports.resize = async (req, res, next) => {
  //check if there is no new files to resize
    if(!req.file) {
        next(); //skip
        return;
    }
    const extension = req.file.mimetype.split('/')[1];
    req.body.photo = `${uuid.v4()}.${extension}`;
    //now we resize
    const photo = await jimp.read(req.file.buffer);
    await photo.resize(800, jimp.AUTO);
    await photo.write(`./public/uploads/${req.body.photo}`);
    //once we have written the photo to our filesystem, keep going!
    next();
};

exports.createStore = async (req, res) => {
    req.body.author = req.user._id;
    const store = await ( new Store(req.body)).save();
    req.flash('success', `${store.name} was successfully added! care to leave a review?`);
    res.redirect(`/store/${store.slug}`);
};

exports.getStores = async (req, res) => {
    const stores = await Store.find();
    res.render('stores', {title: 'Stores', stores});
};

const confirmOwner = (store, user) => {
  if(!store.author.equals(user._id)) {
      throw Error('You must own a store in order to edit it!');
  }
};

exports.editStore = async (req, res) => {
    //find the store given the ID
    const store = await Store.findOne({ _id: req.params.id});

    //2. confirm a user owns the store they want to edit
    confirmOwner(store,req.user);

    //3. Render out the edit form for the user to edit their store
    res.render('editStore', { title: `Edit ${store.name}`, store});
};

exports.updateStore = async (req, res) => {
    //set the location data to a point
    req.body.location.type = "Point";
    //find and update the store
    const store = await Store.findOneAndUpdate({_id: req.params.id}, req.body, {
        new: true, //return new store and not the old one
        runValidators: true
    }).exec();
    req.flash('success', `Successfully updated <strong>${store.name}</strong>. <a href="/store/${store.slug}"> View Store </a>`);
    res.redirect(`/stores/${store.id}/edit`);
    //redirect them to store and tell them update worked
};

exports.getStoreBySlug = async (req, res, next) => {
    const store = await Store.findOne({ slug: req.params.slug}).populate('author');
    if(!store) {
        next();
        return;
    }
    res.render('store', {store, title: store.slug});
};

exports.getStoresByTag = async (req, res) => {
    const tag = req.params.tag;
    //check if tag params is attacjhed or/else display all stores that exist.
    const tagQuery = tag || { $exists: true };
    //setup my individual promises
    const tagsPromise =  Store.getTagsList();
    const storesPromise = Store.find({ tags: tagQuery });
    //destructuring[tags, stores] -> need to look up the theory behind es6 destructuring
    //await the return of all promises into a result.
    const [tags, stores] = await Promise.all([tagsPromise, storesPromise]);
    res.render('tag', { tags, title: 'Tags', tag, stores });
};