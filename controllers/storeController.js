const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const multer = require('multer');
const jimp = require('jimp');
const User = mongoose.model('User');
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
    const page = req.params.page || 1;
    const limit = 4;
    const skip = (page * 4) - limit;


    const storesPromise = Store
        .find()
        .skip(skip)
        .limit(limit)
        .sort({ created: 'desc' });

    const countPromise = Store.count();

    const [stores, count] = await Promise.all([storesPromise, countPromise]);

    const pages = Math.ceil(count / limit);

    if(!stores.length && skip) {
        req.flash('info', `Hey! you asked for a page ${page}, But that doesn't exist, so I put you on the last page:  ${pages}`);
        res.redirect(`/stores/page/${pages}`);
        return;
    }

    res.render('stores', {title: 'Stores', stores, page, pages, count});
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
    //redirect them to store and tell them update worked
    res.redirect(`/stores/${store.id}/edit`);
};

exports.getStoreBySlug = async (req, res, next) => {
    const store = await Store.findOne({ slug: req.params.slug}).populate('author reviews');
    if(!store) {
        next();
        return;
    }
    res.render('store', {store, title: store.slug});
};

exports.getStoresByTag = async (req, res) => {
    const tag = req.params.tag;
    //check if tag params is attached or/else display all stores that exist.
    const tagQuery = tag || { $exists: true };
    //setup my individual promises
    const tagsPromise =  Store.getTagsList();
    const storesPromise = Store.find({ tags: tagQuery });
    //destructuring[tags, stores] -> need to look up the theory behind es6 destructuring
    //await the return of all promises into a result.
    const [tags, stores] = await Promise.all([tagsPromise, storesPromise]);
    res.render('tag', { tags, title: 'Tags', tag, stores });
};


exports.searchStores = async (req, res) => {
    const stores = await Store
        //find Store by query
    .find({
        $text: {
            $search: req.query.q
        }
    }, {
        //add Store score by meta data score
        score: { $meta: 'textScore' }
    })
        //Sort Stores by highest score
    .sort({
        score: { $meta: 'textScore' }
    })
        //limit results to the highest 5 results
        .limit(5);
    res.json(stores);
};


exports.mapStores = async (req, res) => {
    const coordinates = [req.query.lng, req.query.lat].map(parseFloat);
    const q = {
        location: {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates
                },
                $maxDistance: 10000 // 10km
            }
        }
    };

    const stores = await Store.find(q).select('slug name photo description location').limit(10);
    res.json(stores);
};

exports.mapPage = (req,res) => {
    res.render('map', { title: 'Map' });
};

exports.heartStore = async (req, res) => {
    const hearts = req.user.hearts.map(obj => obj.toString());
    const operator = hearts.includes(req.params.id) ? '$pull' : '$addToSet';
    const user = await User
        .findByIdAndUpdate(req.user._id,
        { [operator]: { hearts: req.params.id }},
        { new: true }
    );

    res.json(user);
};

exports.getHearts = async (req, res) => {
  const stores = await Store.find({
      _id: { $in: req.user.hearts }
  });

  res.render('stores', {title: 'Hearted Stores', stores });
};

exports.getTopStores = async (req, res) => {
    const stores = await Store.getTopStores();

    res.render('topStores', { stores, title:' Top Stores!' });
};