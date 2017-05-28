const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const usersController = require('../controllers/usersController');
const authController = require('../controllers/authController');
const { catchErrors } = require('../handlers/errorHandlers');

// Do work here
router.get('/', catchErrors(storeController.getStores));
router.get('/stores', catchErrors(storeController.getStores));
router.get('/add',
    authController.isLoggedIn,
    storeController.addStore);

router.post('/add',
    storeController.upload,
    catchErrors(storeController.resize),
    catchErrors(storeController.createStore));

router.post('/add/:id',
    storeController.upload,
    catchErrors(storeController.resize),
    catchErrors(storeController.updateStore));

router.get('/stores/:id/edit', catchErrors(storeController.editStore));

router.get('/store/:slug', catchErrors(storeController.getStoreBySlug));

router.get('/tags', catchErrors(storeController.getStoresByTag));
router.get('/tags/:tag', catchErrors(storeController.getStoresByTag));

router.get('/login', usersController.loginForm);
router.post('/login', authController.login);
router.get('/register', usersController.registerForm);

router.post('/register',
    usersController.validateRegister,
    usersController.register,
    authController.login
);
router.get('/logout', authController.logout);

module.exports = router;
