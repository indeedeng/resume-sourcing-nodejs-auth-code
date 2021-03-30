var express = require('express');
var router = express.Router();

const config = require('../config');
const IndeedOAuthService = require('../services/IndeedOAuthService');

router.get('/', async function(req, res, next) {
    const indeedOAuth = new IndeedOAuthService(config, req.session);
    try {

        // validate Auth Code
        await indeedOAuth.validateAuthorizationCode(req);

        // if everything good, redirect to index
        res.redirect('/');
    } catch (err) {
        console.dir(err, {depth: null});
        throw err;
    }
});

module.exports = router;
