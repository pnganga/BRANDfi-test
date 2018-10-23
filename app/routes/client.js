var express = require('express');
var router = express.Router();
var app = express();
var util = require('util');
var request = require('request');
var path = require('path');
var passport = require('passport');
var fs = require("fs");
var formidable = require('formidable');
var users = require('../controllers/users');
var clients = require('../controllers/clients');


// ####################################################
// Client signin page
// #######################################################
router.route('/client/signin')
    .get(function(req, res) {
        res.render('clientSignin', req.session);
    })
    .post(function(req, res) {
        var fName = req.body.fname;
        var lName = req.body.lname;
        var email = req.body.email;
        var company = req.body.company;
        var mobileNumber = req.body.mobilenumber;
        var venue = req.body.venue;
        // save client to mysql
        clients.create(fName, lName, email, mobileNumber, company, venue);
    });


// ####################################################
// Client signup page
// #######################################################
router.route('/client/signup')
    .get(function(req, res) {
        res.render('clientSignup', req.session);
    })
    .post(function(req, res) {
        // var fName = req.body.fname;
        // var lName = req.body.lname;
        // var email = req.body.email;
        // var company = req.body.company;
        // var mobileNumber = req.body.mobilenumber;
        // var venue = req.body.venue;
        // save client to mysql
        // clients.create(fName, lName, email, mobileNumber, company, venue);
        // redirect to sign in page
        // res.redirect('/customizepage');
        console.log(req.body);
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
            var newpath = ('/home/pnganga/BRANDfi-test/public/img/logos' || '/home/pnganga/Desktop/BRANDfi-test/public/img/logos') + files.logo.name;
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
        res.render('client-dashboard');
    });
router.route('/client/customize/mobile')
    .get(function(req, res) {
        fs.readFile( "/home/pnganga/BRANDfi-test/views/partials/head.hbs", "utf8", function(err, data) {
            if (err) throw err;
            fs.readFile("/home/pnganga/BRANDfi-test/views/partials/clickhead.hbs", "utf8", function(err, dat) {
                req.session.editor_content = data + dat;
                res.render('customize-mobile', req.session);
            })

        })
    })
    .post(function(req, res) {
        req.session.editor_content = req.body.editor_content;
        fs.writeFile(("/home/pnganga/BRANDfi-test/views/partials/clickhead.hbs", req.session.editor_content, "utf8", function(err, data) {
            if (err) throw err;

            console.log(data);
            res.render('customize-mobile', req.session);
        })
    });
router.route('/client/allusers')
    .get(function(req, res) {
        users.getAll(function(none, allUsers) {
            console.log(allUsers)
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