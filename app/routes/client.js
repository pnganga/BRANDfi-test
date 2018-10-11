var express = require('express');
var router = express.Router();
var app = express();
var util = require('util');
var request = require('request');
var path = require('path');
var passport = require('passport');

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
        var fName = req.body.fname;
        var lName = req.body.lname;
        var email = req.body.email;
        var company = req.body.company;
        var mobileNumber = req.body.mobilenumber;
        var venue = req.body.venue;
        // save client to mysql
        clients.create(fName, lName, email, mobileNumber, company, venue);
        // redirect to sign in page
        res.redirect('/customizepage');
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

router.route('/image_upload')
    .post(function(req, res) {

        upload_image(req, function(err, data) {

            if (err) {
                return res.status(404).end(JSON.stringify(err));
            }
            console.log(data);
            res.send(data);
        });

    });


module.exports = router;