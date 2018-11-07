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
                // use bycrypt to check if password is valid
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
        var franchiseName = req.body.vname.toLowerCase();
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

        // create splash pages that user has chosen and save to user views folder

        if (smsSplash && smsSplash == "on") {
            // Check if all necessary directories for franchise views exist and if not create them
            if (!fs.existsSync("/home/pnganga/Desktop/BRANDfi-test/views/franchiseViews")) {
                fs.mkdirSync("/home/pnganga/Desktop/BRANDfi-test/views/franchiseViews");
            }
            if (!fs.existsSync("/home/pnganga/Desktop/BRANDfi-test/views/franchiseViews" + franchiseName)) {
                fs.mkdirSync("/home/pnganga/Desktop/BRANDfi-test/views/franchiseViews/" + franchiseName);
            }
            if (!fs.existsSync("/home/pnganga/Desktop/BRANDfi-test/views/franchiseViews/" + franchiseName + "/SMS")) {
                fs.mkdirSync("/home/pnganga/Desktop/BRANDfi-test/views/franchiseViews/" + franchiseName + "/SMS");
            }
            // Read SMS welcome splash page template
            fs.readFile("/home/pnganga/Desktop/BRANDfi-test/views/templates/smsSplashWelcome.hbs", "utf8", function(err, welcomeData) {


                // write and save to franchise's views folder 
                fs.writeFile("/home/pnganga/Desktop/BRANDfi-test/views/franchiseViews/" + franchiseName + "/" + "SMS/" + "SmsSplashWelcome.hbs", welcomeData, "utf8", function(err, welcomeWritedata) {
                    if (err) { console.log(err) }
                    // Read SMS confirm splash page template           
                    fs.readFile("/home/pnganga/Desktop/BRANDfi-test/views/templates/smsSplashConfirm.hbs", "utf8", function(err, confirmData) {
                        // write and save confirm page to franchise's view folder
                        fs.writeFile("/home/pnganga/Desktop/BRANDfi-test/views/franchiseViews/" + franchiseName + "/" + "SMS/" + "SmsSplashConfirm.hbs", confirmData, "utf8", function(err, confirmWritedata) {
                            // READ SMS success splash page template 
                            fs.readFile("/home/pnganga/Desktop/BRANDfi-test/views/templates/smsSplashSuccess.hbs", "utf8", function(err, successData) {
                                // write and save success page to franchise's view folder
                                fs.writeFile("/home/pnganga/Desktop/BRANDfi-test/views/franchiseViews/" + franchiseName + "/" + "SMS/" + "SmsSplashSuccess.hbs", successData, "utf8", function(err, sucesssWritedata) {
                                    // ################
                                    // Create express routes for handling SMS login logic
                                    // ###################

                                    // create directory to store route files
                                    if (!fs.existsSync("/home/pnganga/Desktop/BRANDfi-test/controllers/" + franchiseName.replace(/\s+/g, ''))) {
                                        fs.mkdirSync("/home/pnganga/Desktop/BRANDfi-test/controllers/" + franchiseName.replace(/\s+/g, ''));
                                        // copy sms routes template file and write to sms logic franchise file
                                        // READ SMS success splash page template 
                                        fs.readFile("/home/pnganga/Desktop/BRANDfi-test/smsRoutes.txt", "utf8", function(err, routesData) {
                                            fs.writeFile("/home/pnganga/Desktop/BRANDfi-test/controllers/" + franchiseName + "/" + franchiseName + ".controller.js", routesData, "utf8", function(err, routesWritedata) {
                                                delete require.cache[app];
                                                var smsSplashUrl = req.headers.host + "/" + franchiseName + "/sms";
                                                // Save client details to db
                                                clients.create(fName, lName, email, mobileNumber, franchiseName, password);
                                                // Save venue/franchise details

                                                franchise.create(franchiseName, franchiseLocation, franchiseCountry, noOfAps, smsSplashUrl, socialSplash, voucherSplash, vouchersmsSplash, usernamepasswordSplash);
                                                clients.getOneByEmail(email, function(nil, clie) {
                                                    if (nil) {
                                                        console.log('nothing to return');
                                                    }
                                                    req.session.client = clie[0];
                                                    res.redirect('/client/dashboard');

                                                });


                                            })
                                        })
                                    }
                                })
                            })
                        })
                    })

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
            console.log(files);
            var franchiseImgFolder = '/home/pnganga/Desktop/BRANDfi-test/public/img/' + req.session.client.franchiseName;
            if (!fs.existsSync(franchiseImgFolder)) {
                fs.mkdirSync(franchiseImgFolder);
            }
            var oldpath = files.file.path;
            var newpath = franchiseImgFolder + "/" + files.file.name;
            fs.rename(oldpath, newpath, function(err) {
                if (err) throw err;

                req.session.msg = "Logo successfully uploaded"
                res.send(JSON.stringify({ link: '/img/' + req.session.client.franchiseName + "/" + files.file.name }));

            });
        });

    });

// #############################################################################################################
// Routes for client dashboard routes
// ##############################################################################################################

router.route('/client/dashboard')
    .get(function(req, res) {
        if (req.session.client) {
            res.render('client-dashboard', req.session);
        } else {
            res.redirect('/client/signin');
        }

    });
router.route('/client/customize/sms-welcome')
    .post(function(req, res) {
        // console.log(req.body.content);
        req.session.smsSplashWelcome_content = req.body.content;
        fs.writeFile("/home/pnganga/Desktop/BRANDfi-test/views/franchiseViews/" + req.session.client.franchiseName + "/SMS/" + "SmsSplashWelcome.hbs", req.session.smsSplashWelcome_content, "utf8", function(err, data) {
            if (err) throw err;
            console.log('page saved');

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


router.route('/client/splash-pages')
    .get(function(req, res) {
        // read sms welcome page
        fs.readFile("/home/pnganga/Desktop/BRANDfi-test/views/franchiseViews/" + req.session.client.franchiseName + "/SMS/" + "SmsSplashWelcome.hbs", "utf8", function(err, welcomedata) {
            req.session.smsSplashWelcome_content = welcomedata;
            // read sms confirm page
            fs.readFile("/home/pnganga/Desktop/BRANDfi-test/views/franchiseViews/" + req.session.client.franchiseName + "/SMS/" + "SmsSplashConfirm.hbs", "utf8", function(err, confirmdata) {
                req.session.smsSplashConfirm_content = confirmdata;

                // read sms success page
                fs.readFile("/home/pnganga/Desktop/BRANDfi-test/views/franchiseViews/" + req.session.client.franchiseName + "/SMS/" + "SmsSplashSuccess.hbs", "utf8", function(err, successdata) {
                    req.session.smsSplashSuccess_content = successdata;

                    res.render('client-splash-pages', req.session);
                })
            })
            
        })


    })

module.exports = router;