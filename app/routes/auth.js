var express = require('express');
var router = express.Router();
var app = express();
var util = require('util');
var request = require('request');
var path = require('path');
var passport = require('passport');

var users = require('../controllers/users');
var clients = require('../controllers/clients');


// ****************************************
// PASSPORT Login Methods for Click Through
// ****************************************

// LOCAL Login
router.route('/auth/login')
    // show the login form
    .get(function(req, res) {
        res.render('login', { message: req.flash('loginMessage'), session: req.session });
    })

    // process the login form
    .post(passport.authenticate('local-login', {
        successRedirect: '/auth/wifi', // redirect to the secure profile section
        failureRedirect: '/auth/login', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));




router.route('/forgotpassword')
    // show the login form
    .get(function(req, res) {
        res.render('forgotpassword', req.session);
    })
    // process the login form
    .post(function(req, res) {
        var uname = req.body.username;
        // use phone number to check if user exists
        var clientServerOptions = {
            uri: 'http://radius.brandfi.co.ke/api/user/by-phone/' + uname,
            method: 'GET',
        }

        request(clientServerOptions, function(err, data) {
            var resp = data.headers;
            var rBody = JSON.parse(data.body);
            // if user exists
            if (resp['content-length'] > 0) {
                var pword = rBody.clear_pword;
                var fname = rBody.fname;

                // send sms with password

                var url = 'http://pay.brandfi.co.ke:8301/sms/send';
                var clientId = '1';
                var message = "Jambo " + fname + ",Your username is " + uname + " and your password is " + pword;

                var postData = {
                    clientId: clientId,
                    message: message,
                    recepients: uname
                }

                var clientServerOptions = {
                    uri: 'http://pay.brandfi.co.ke:8301/sms/send',
                    body: JSON.stringify(postData),
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
                // send sms
                request(clientServerOptions, );
                res.render('login', req.session);
            }
        })
    });

// Signup =================================
// show the signup form
router.route('/auth/signup')
    .get(function(req, res) {
        console.log(req.session)
        res.render('signup', { message: req.flash('signupMessage'), session: req.session });
    });

// process the signup form
router.route('/auth/signup')
    .post(passport.authenticate('local-signup', {
        successRedirect: '/auth/wifi', // redirect to the secure profile section
        failureRedirect: '/auth/signup', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));


router.route('/auth/signon')
    .post(function(req, res) {
        var url = 'http://radius.brandfi.co.ke/api/registration?';
        var uname = req.body.username;
        var fname = req.body.firstname;
        var lname = req.body.lastname;
        var queryParams = "uname=" + uname + "&fname=" + fname + "&lname=" + lname + "&contact=" + uname + "&status=" + 1;

        var clientServerOptions = {
            uri: url + queryParams,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        }


        request(clientServerOptions, function(err, res) {
            var resp = JSON.parse(res.body);
            console.log(resp.status);
        });
        res.redirect('/auth/login');
    });

// FACEBOOK -------------------------------

// send to facebook to do the authentication
router.route('/auth/facebook')
    .get(passport.authenticate('facebook'));

router.route('/auth/facebook/callback')
    .get(passport.authenticate('facebook', {
        successRedirect: '/auth/wifi',
        failureRedirect: '/auth/facebook'
    }));

// TWITTER -------------------------------

// send to twitter to do the authentication
router.route('/auth/twitter')
    .get(passport.authenticate('twitter'));

router.route('/auth/twitter/callback')
    .get(passport.authenticate('twitter', {
        successRedirect: '/auth/wifi',
        failureRedirect: '/auth/twitter'
    }));




module.exports = router;