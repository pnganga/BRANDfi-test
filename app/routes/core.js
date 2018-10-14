var express = require('express');
var router = express.Router();
var app = express();
var util = require('util');
var request = require('request');
var path = require('path');
var passport = require('passport');

var users = require('../controllers/users');
var clients = require('../controllers/clients');


// #############
// terms of service page
// #############
router.route('/termsJava')
    .get(function(req, res) {
        res.render('termsJava', req.session);
    });


// ##########################
// Home page
// #########################
router.route('/')
    .get(function(req, res) {
        res.render('index', req.session);
    });

module.exports = router;