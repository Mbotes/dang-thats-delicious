const mongoose = require('mongoose');
const Store = mongoose.model('Store');

exports.homePage = (req, res) => {
    res.render('index', {title: 'Dang!'});
};

exports.addStore = (req, res) => {
    res.render('editStore', {title: 'Add Store'});
};

exports.createStore = async (req, res) => {
    const store = await ( new Store(req.body)).save();
    req.flash('success', `${store.name} was successfully added! care to leave a review?`);
    res.redirect(`/store/${store.slug}`);
};

exports.getStores = async (req, res) => {
    const stores = await Store.find();
    res.render('stores', {title: 'Stores', stores});
};

exports.editStore = async (req, res) => {
    //find the store given the ID
    const store = await Store.findOne({ _id: req.params.id});

    //2. confirm a user owns the store they want to edit
    //TODO

    //3. Render out the edit form for the user to edit their store
    res.render('editStore', { title: `Edit ${store.name}`, store});
};

exports.updateStore = async (req, res) => {
    //find and update the store
    const store = await Store.findOneAndUpdate({_id: req.params.id}, req.body, {
        new: true, //return new store and not the old one
        runValidators: true
    }).exec();
    req.flash('success', `Successfully updated <strong>${store.name}</strong>. <a href="/stores/${store.slug}"> View Store </a>`);
    res.redirect(`/stores/${store.id}/edit`);
    //redirect them to store and tell them update worked
};