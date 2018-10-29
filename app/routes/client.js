var express = require('express');
var router = express.Router();
var app = express();
var util = require('util');
var request = require('request');
var path = require('path');
var passport = require('passport');
var fs = require("fs");
var formidable = require('formidable');
var mkdirp = require('mkdirp');
var users = require('../controllers/users');
var clients = require('../controllers/clients');
var franchise = require('../controllers/franchise');

// ####################################################
// Client signin page
// #######################################################
router.route('/client/signin')
    .get(function(req, res) {
        res.render('clientSignin', req.session);
    })
    .post(function(req, res) {
        var email = req.body.email;
        var password = req.body.password;
        clients.getOneByEmail(email, function(nil, client) {
            if (nil) {
                req.session.clientErr = "User does not exist";
                res.redirect('/client/signup');

            } else {

               req.session.client = client[0];
               res.redirect('/client/dashboard');
            }

        })
    });
router.route('/client/logout')
    .get(function(req, res) {
        delete req.session.client;
        res.redirect('/client/signin');

    })

// ####################################################
// Client signup page
// #######################################################
router.route('/client/signup')
    .get(function(req, res) {
        if (req.session.client) {
            res.redirect('/client/dashboard');
        } else {
            res.render('clientSignup', req.session);
        }

    })
    .post(function(req, res) {

        var fName = req.body.fname;
        var lName = req.body.lname;
        var mobileNumber = req.body.mobilenumber;
        var email = req.body.email;
        var password = req.body.password;
        var franchiseName = req.body.vname;
        var franchiseLocation = req.body.vlocation;
        var franchiseCountry = req.body.country;
        var noOfAps = req.body.aps;
        var smsSplash;
        var socialSplash;
        var voucherSplash;
        var vouchersmsSplash;
        var usernamepasswordSplash;
        if (req.body.smssplash) {
            smsSplash = req.body.smssplash;
        } else if (req.body.socialsplash) {
            socialSplash = req.body.socialsplash;
        } else if (req.body.vouchersplash) {
            voucherSplash = req.body.vouchersplash;
        } else if (req.body.vouchersmssplash) {
            vouchersmsSplash = req.body.vouchersmssplash;
        } else if (req.body.usernamepasswordsplash) {
            usernamepasswordSplash = req.body.usernamepasswordsplash;
        }
        // Save client details to db
        clients.create(fName, lName, email, mobileNumber, franchiseName, password);

        // Save venue/franchise details
        franchise.create(franchiseName, franchiseLocation, franchiseCountry, noOfAps, smsSplash, socialSplash, voucherSplash, vouchersmsSplash, usernamepasswordSplash);
        // create splash pages that user has chosen and save to user views folder
        var smsPage = franchiseName + "sms.hbs";
        if (smsSplash == "on") {
            fs.readFile("/home/pnganga/Desktop/BRANDfi-test/views/java-sms.hbs", "utf8", function(err, data) {
                fs.writeFile("/home/pnganga/Desktop/BRANDfi-test/views/" + smsPage, data, "utf8", function(err, data) {
                    if (err) { console.log(err) }

                    // log user In
                    console.log('getting user');
                    clients.getOneByEmail(email, function(nil, clie) {
                        if (nil) {
                            console.log('nothing to return');
                        }
                        console.log(clie);
                        req.session.client = clie[0];
                        // res.send(req.session.client);
                        res.redirect('/client/dashboard');

                    });
                })

            });
        } else if (req.body.socialSplash) {
            socialSplash = req.body.socialSplash;
        } else if (req.body.voucherSplash) {
            voucherSplash = req.body.voucherSplash;
        } else if (req.body.vouchersmsSplash) {
            vouchersmsSplash = req.body.vouchersmsSplash;
        } else if (req.body.usernamepasswordSplash) {
            usernamepasswordSplash = req.body.usernamepasswordSplash;
        }


    });


// #########################################
// Froala editor save page
// ############################################
router.route('/customizepage')
    .get(function(req, res) {
        res.render('customize', req.session);
    });

router.route('/custompage')
    .post(function(req, res) {
        // save content to session
        req.session.editor_content = req.body.editor_content;
        // Write content to Page
        fs.writeFile(__dirname + "/views/partials/clickhead.hbs", req.session.editor_content, "utf8", function(err, data) {
            if (err) throw err;
            console.log(data);
            res.render('customize', req.session);
        })

    });

router.route('/logo/upload')
    .get(function(req, res) {
        res.render('upload_logo');
    })
    .post(function(req, res) {
        var form = new formidable.IncomingForm();
        form.parse(req, function(err, fields, files) {
            console.log(files.logo.path);
            var oldpath = files.logo.path;
            var newpath = ('/home/pnganga/Desktop/BRANDfi-test/public/img/logos' || '/home/pnganga/Desktop/BRANDfi-test/public/img/logos/') + files.logo.name;
            fs.rename(oldpath, newpath, function(err) {
                if (err) throw err;

                req.session.msg = "Logo successfully uploaded"
                res.render('client-dashboard', req.session);

            });
        });

    });

// #############################################################################################################
// Routes for client dashboard routes
// ##############################################################################################################

router.route('/client/dashboard')
    .get(function(req, res) {
        console.log(req.session.client);
        if (req.session.client) {
            res.render('client-dashboard', req.session);
        } else {
            res.redirect('/client/signin');
        }

    });
router.route('/client/customize/mobile')
    .get(function(req, res) {
        fs.readFile("/home/pnganga/Desktop/BRANDfi-test/views/partials/head.hbs", "utf8", function(err, data) {
            if (err) throw err;
            fs.readFile("/home/pnganga/Desktop/BRANDfi-test/views/partials/clickhead.hbs", "utf8", function(err, dat) {
                req.session.editor_content = data + dat;
                res.render('customize-mobile', req.session);
            })

        })
    })
    .post(function(req, res) {
        req.session.editor_content = req.body.editor_content;
        fs.writeFile("/home/pnganga/Desktop/BRANDfi-test/views/partials/clickhead.hbs", req.session.editor_content, "utf8", function(err, data) {
            if (err) throw err;
            console.log(data);
            res.render('customize-mobile', req.session);
        })
    });
router.route('/client/allusers')
    .get(function(req, res) {
        users.getAll(function(none, allUsers) {
            req.session.users = allUsers;
            res.render('all-users', req.session);
        })

    });
router.route('/facebook/credentials')
    .post(function(req, res) {
        var clientId = req.body.fbClientId;
        var clientSecret = req.body.fbClientSecret;
        // save fb credentials to db;
        res.send('saved successfully');
    });
router.route('/twitter/credentials')
    .post(function(req, res) {
        var consumerId = req.body.fbClientId;
        var consumerSecret = req.body.fbClientSecret;
        // save fb credentials to db;
        res.send('saved successfully');
    })

module.exports = router;