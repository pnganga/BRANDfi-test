// app.js

// ################################################################
// Overview
// ################################################################
/*
External Captive Portal (ExCAP) for Cisco Meraki MR access points and MX security appliances.

This application provides a click-through (with Passports) and sign-on (with RADIUS auth) splash page where the login will complete on a success page.

Click-through usage:   https://yourserver/click
  Authentication provided by Passport OAuth for social network login
  http://passportjs.org/

Sign-on usage:         https://yourserver/signon
  Authentication provided by third party RADIUS server

Data can be exported using the MongoDB REST API
  https://yourserver.com:8181/api/v1/users
  https://yourserver.com:8181/api/v1/sessions

NOTE:
The config directory will need to be updated prior to running application.
The database, social OAuth API keys and SSL certificates will need to be defined.

All session and user data is stored in a local MongoDB, which needs to be installed and running first!
https://docs.mongodb.org/manual/installation/

All HTML content uses Handlebars to provide dynamic data to the various pages.
The structure of the HTML pages can be modified under /views/
Images, styles and client scripts are stored in /public/



This application comes with no guarantee and is intended as a proof of concept. 
Proper testing and security (SSL) should be configured and verified before using in a production environment.

Feel free to use, abuse and help contribue to this code.

Written by Cory Guynn - 2016
www.InternetOfLego.com

I <3 open source

*/

// ################################################################
// Utilities
// ################################################################

// used for debugging purposes to easily print out object data
var util = require('util');
//Example: console.log(util.inspect(myObject, false, null));

// display all web requests on console
var morgan = require('morgan');

// database to store user & session info
var configDB = require('./config/database.js');
var mongoose = require('mongoose');

// ################################################################
// Web Services and Middleware
//  Express with SSL
// ################################################################


// var config = require('./config/config.js')
var port = 8181;
var https = require('https');
var app = require('express')();
var request = require('request');
var path = require('path');
var fs = require("fs");

// =================================
// express webserver service
// =================================
var express = require('express');

// create the web app
var app = express();


// #####################################################
// sql database connection
// #####################################################

var db = require('./db');
var users = require('./app/controllers/users');

// Connect to MySQL on start
db.connect(db.MODE_PRODUCTION, function(err) {
    if (err) {
        console.log('Unable to connect to MySQL.')
        process.exit(1)
    }
})

// ######################################################
// end mysql connection
// ######################################################

// =================================
// passport configuration
// =================================

// connect to our database via mongoose
mongoose.connect(configDB.url);

// social extra utils
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport = require('passport');
var flash = require('connect-flash');

app.use(morgan('dev')); // log every request to the console
app.use(flash()); // use connect-flash for flash messages stored in session

require('./config/passport')(passport); // pass passport for configuration
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(cookieParser()); // read cookies (needed for auth)




// ###################################
// Allow cors
// ###################################
app.use(function(req, res, next) { //allow cross origin requests
    res.setHeader("Access-Control-Allow-Methods", "POST, PUT, OPTIONS, DELETE, GET");
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
// +++++++++++++++++++
// End allow cors
// +++++++++++++++++++




// =================================
// session state
// =================================

var session = require('express-session');
var MongoDBStore = require('connect-mongodb-session')(session);
var store = new MongoDBStore({
    //uri: 'mongodb://localhost:27017/excap',
    uri: configDB.url,
    collection: 'sessions'
});
// Catch errors
store.on('error', function(error) {
    console.log("error connecting to MongoDBStore: " + error);
});

app.use(session({
    secret: 'supersecret', // this secret is used to encrypt cookie and session state. Client will not see this.
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 // 1 day
    },
    store: store,
    resave: true,
    saveUninitialized: true
}));





// instruct the app to use the `bodyParser()` middleware for all routes
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());


// =================================
// Handlebars to provide dynamic content in HTML pages
// =================================

var exphbs = require('express3-handlebars');
app.engine('.hbs', exphbs({ defaultLayout: 'main', extname: '.hbs', }));
app.set('view engine', '.hbs');


// #########################################################################
// Froala WYSIWYG Editor to enable users create custom splash pages
// #########################################################################

var FroalaEditor = require('wysiwyg-editor-node-sdk');

var upload_image = require("./app/controllers/image_upload.js");

// Create folder for uploading files.
var filesDir = path.join(path.dirname(require.main.filename), "uploads");

if (!fs.existsSync(filesDir)) {
    fs.mkdirSync(filesDir);
}

// =================================
// ROUTES #########################################################
// =================================

// =================================
// Admin Site mongodb API access
// =================================

// provide MongoDB REST API for JSON session data
// SECURITY WARNING -- ALL USER and SESSION DATA IS AVAILABLE BY ACCESSING THIS ROUTE ! ! ! !
// need to implement tokens / auth solution
// example to pull JSON data http://yourserver:8181/api/v1/users
var expressMongoRest = require('express-mongo-rest');
app.use('/api/v1', expressMongoRest('mongodb://localhost:27017/excap'));



// ################################################################
// Click-through Splash Page: using passport for social login
// ################################################################


// serving the static click-through HTML splash page
app.get('/click', function(req, res) {

    // extract parameters (queries) from URL
    req.session.protocol = req.protocol;
    req.session.host = req.headers.host;
    req.session.base_grant_url = req.query.base_grant_url;
    req.session.user_continue_url = req.query.user_continue_url;
    req.session.node_mac = req.query.node_mac;
    req.session.client_ip = req.query.client_ip;
    req.session.client_mac = req.query.client_mac;
    req.session.splashclick_time = new Date().toString();
    req.session.logout_url_continue = false; // no support for logout url with click through method

    // success page options instead of continuing on to intended url
    req.session.continue_url = req.query.user_continue_url;
    req.session.success_url = req.session.protocol + '://' + req.session.host + "/successClick";
    // req.session.success_url = req.query.user_continue_url;


    // display session data for debugging purposes
    console.log("Session data at click page = " + util.inspect(req.session, false, null));

    // render login page using handlebars template and send in session data
    res.render('click-through', req.session);

});

// #############
// success for click through page
// #############
app.get('/successClick', function(req, res) {
    // extract parameters (queries) from URL
    req.session.host = req.headers.host;
    req.session.success_time = new Date();

    // console.log("Session data at success page = " + util.inspect(req.session, false, null));

    // render sucess page using handlebars template and send in session data
    res.render('success', req.session);
});

app.get('/taylorClick', function(req, res) {
    // extract parameters (queries) from URL
    req.session.host = req.headers.host;
    req.session.success_time = new Date();

    // console.log("Session data at success page = " + util.inspect(req.session, false, null));

    // render sucess page using handlebars template and send in session data
    res.render('successTaylor', req.session);
});


// ****************************************
// PASSPORT Login Methods for Click Through
// ****************************************

// LOCAL --------------------------------

// Login ===============================

// show the login form
app.get('/auth/login', function(req, res) {
    res.render('login', { message: req.flash('loginMessage'), session: req.session });
});

// process the login form
app.post('/auth/login',
    passport.authenticate('local-login', {
        successRedirect: '/auth/wifi', // redirect to the secure profile section
        failureRedirect: '/auth/login', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));

// show the login form
app.get('/forgotpassword', function(req, res) {
    res.render('forgotpassword', req.session);
});

// process the login form
app.post('/forgotpassword', function(req, res) {
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
app.get('/auth/signup', function(req, res) {
    console.log(req.session)
    res.render('signup', { message: req.flash('signupMessage'), session: req.session });
});

// process the signup form
app.post('/auth/signup',
    passport.authenticate('local-signup', {
        successRedirect: '/auth/wifi', // redirect to the secure profile section
        failureRedirect: '/auth/signup', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    })
);

app.post('/auth/signon', function(req, res) {
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
    // send sms
    request(clientServerOptions, function(err, res) {
        var resp = JSON.parse(res.body);
        console.log(resp.status);
    });
    res.redirect('/auth/login');
});

// FACEBOOK -------------------------------

// send to facebook to do the authentication
app.get('/auth/facebook',
    passport.authenticate('facebook'));

app.get('/auth/facebook/callback',
    passport.authenticate('facebook', {
        successRedirect: '/auth/wifi',
        failureRedirect: '/auth/facebook'
    })
);

// TWITTER -------------------------------

// send to facebook to do the authentication
app.get('/auth/twitter',
    passport.authenticate('twitter'));

app.get('/auth/twitter/callback',
    passport.authenticate('twitter', {
        successRedirect: '/auth/wifi',
        failureRedirect: '/auth/twitter'
    })
);


// LINKEDIN --------------------------------

app.get('/auth/linkedin',
    passport.authenticate('linkedin'));

app.get('/auth/linkedin/callback',
    passport.authenticate('linkedin', {
        successRedirect: '/auth/wifi',
        failureRedirect: '/auth/linkedin'
    })
);

// GOOGLE ---------------------------------

// send to google to do the authentication
app.get('/auth/google', passport.authenticate('google'));

// the callback after google has authenticated the user
app.get('/auth/google/callback',
    passport.authenticate('google', {
        successRedirect: '/auth/wifi',
        failureRedirect: '/auth/google'
    })
);

// ====================================================
// Sms Auth ---------------------------------
// ====================================================

// authenticate wireless session with Cisco Meraki
app.post('/auth/sms', function(req, res) {
    // generate confirmation code
    var smsConfirmationCode = Math.floor(1000 + Math.random() * 9000);
    var mobileNumber = req.body.mobileNumber;
    users.create(mobileNumber, smsConfirmationCode);
    // Prepare sms data
    var url = 'http://pay.brandfi.co.ke:8301/sms/send';
    var clientId = '1';
    var message = "The confirmation to verify your phone number on Tayler Grey Wifi is " + smsConfirmationCode;

    var postData = {
        clientId: clientId,
        message: message,
        recepients: mobileNumber
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
    request(clientServerOptions);
    res.redirect('/auth/confirmsms');

});

// ====================================================
// Confirm sms---------------------------------
// ====================================================

// Render page for sms confirmation
app.get('/auth/confirmsms', function(req, res) {
    res.render('confirmsms.hbs', req.session)
});
// Sms confirmation logic
app.post('/auth/confirmsms', function(req, res) {
    // res.send(req.body.code);
    users.getOne(req.body.code, function(err, arg) {
        if (err) {
            req.session.error = 'The confirmation code is not correct';
            res.render('confirmsms', req.session);
        } else {
            var newUser = arg[0].username;
            var newPassword = arg[0].value;
            var ur = req.session.login_url + "?username=" + newUser + "&password=" + newPassword + "&success_url=" + req.session.success_url;
            var clientServerOptions = {
                uri: ur,
                method: 'POST'
            }
            // return credentials to meraki for auth
            request(clientServerOptions, function(err, msg) {
                if (err) res.send(err);
                console.log("auth sent to meraki");
                console.log(msg);
            });
        }
    });
});


// ====================================================
// WiFi Auth ---------------------------------
// ====================================================

// authenticate wireless session with Cisco Meraki
app.get('/auth/wifi', function(req, res) {
    req.session.splashlogin_time = new Date().toString();

    // debug - monitor : display all session data on console
    console.log("Session data at login page = " + util.inspect(req.session, false, null));

    // *** redirect user to Meraki to process authentication, then send client to success_url
    res.writeHead(302, { 'Location': req.session.base_grant_url + "?continue_url=" + req.session.success_url });
    res.end();
});


// ####################################################################
// Splash page for premium users
// 3######################################################################

app.get('/premium', function(req, res) {
    delete req.session["mpesaError"];
    delete req.session["mpesaFinishError"];
    // extract parameters (queries) from URL
    req.session.protocol = req.protocol;
    req.session.host = req.headers.host;
    req.session.base_grant_url = req.query.base_grant_url;
    req.session.user_continue_url = req.query.user_continue_url;
    req.session.node_mac = req.query.node_mac;
    req.session.client_ip = req.query.client_ip;
    req.session.client_mac = req.query.client_mac;
    req.session.splashclick_time = new Date().toString();
    req.session.logout_url_continue = false; // no support for logout url with click through method

    console.log(req.session);
    // success page options instead of continuing on to intended url
    req.session.continue_url = req.query.user_continue_url;
    req.session.success_url = "https://www.google.com";

    var url = 'http://radius.brandfi.co.ke/api/tarrifs';
    var tariffs = [];

    // Fetch tarriffs from RADIUS server
    var clientServerOptions = {
        uri: url,
        method: 'GET',
    }

    request(clientServerOptions, function(err, data) {
        var resp = JSON.parse(data.body);
        tariffs = resp;
        // render login page using handlebars template and send in session data
        res.render('premium', { session: req.session, tariffs: tariffs });
    });



});

app.post('/premium', function(req, res) {
    var fname = req.body.fname;
    var lname = req.body.lname;
    var uname = req.body.uname;
    var plan = req.body.plan;

    // use phone number to check if user exists
    var clientServerOptions = {
        uri: 'http://radius.brandfi.co.ke/api/user/by-phone/' + uname,
        method: 'GET',
    }

    request(clientServerOptions, function(err, data) {
        if (err) { res.send(err); }
        var resp = data.headers;
        // if user exists
        if (resp['content-length'] > 0) {
            console.log('user exists');
            // login user and send stk push
            var rBody = JSON.parse(data.body);
            var userServerOptions = {

                uri: 'http://radius.brandfi.co.ke/api/login?' + 'uname=' + uname + '&pword=' + rBody.clear_pword,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            }
            request(userServerOptions, function(err, loginRes) {
                if (err) console.log('error');
                var userDetails = JSON.parse(loginRes.body);
                req.session.user = userDetails;
                var phoneNumber = userDetails.user.contact.substr(1);
                var postData = {
                    "clientId": "2",
                    "transactionType": "CustomerPayBillOnline",
                    "phoneNumber": '254' + phoneNumber,
                    "amount": 1,
                    "callbackUrl": "http://localhost:8181/payfi-success",
                    "accountReference": "demo",
                    "transactionDesc": "Test"
                }
                var reqOptions = {
                    uri: 'http://pay.brandfi.co.ke:8301/api/stkpush',
                    method: 'POST',
                    body: JSON.stringify(postData),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
                request(reqOptions, function(err, respMessage) {
                    if (err) console.log('error');

                    var respM = JSON.parse(respMessage.body);
                    var merchantRequestID = respM.merchantRequestID;
                    var CheckoutRequestID = respM.CheckoutRequestID;
                    var ResponseCode = respM.ResponseCode;
                    var ResponseDescription = respM.ResponseDescription;
                    var customerMessage = respM.CustomerMessage;
                    req.session.CheckoutRequestID = CheckoutRequestID

                    res.redirect('/successPremium');

                })
            })
            // if the user doesnt exist, sign him up
        } else if (resp['content-length'] < 1) {
            console.log('user does not exist');
            // signup user and send stk push
            var url = 'http://radius.brandfi.co.ke/api/registration?';
            var queryParams = "uname=" + uname + "&fname=" + fname + "&lname=" + lname + "&contact=" + uname + "&status=" + 1;

            var clientServerOptions = {
                uri: url + queryParams,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            }

            // sign up user
            request(clientServerOptions, function(err, signupres) {
                var resp = JSON.parse(signupres.body);
                // if user is successfully signed up, log him in and send stk push
                if (resp.status == "success") {
                    // use phone number to check if user exists
                    var clientServerOptions = {
                        uri: 'http://radius.brandfi.co.ke/api/user/by-phone/' + uname,
                        method: 'GET',
                    }

                    request(clientServerOptions, function(err, data) {
                        if (err) { res.send(err); }
                        var resp = data.headers;
                        // if user exists
                        if (resp['content-length'] > 0) {
                            // login user and send stk push
                            var userData = JSON.parse(data.body);
                            var userOptions = {

                                uri: 'http://radius.brandfi.co.ke/api/login?' + 'uname=' + uname + '&pword=' + userData.clear_pword,
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                }
                            }
                            request(userOptions, function(err, loginRes) {
                                if (err) console.log('error');
                                var userDetails = JSON.parse(loginRes.body);
                                console.log(userDetails);
                                req.session.user = userDetails;
                                var phoneNumber = userDetails.user.contact.substr(1);
                                var postData = {
                                    "clientId": "2",
                                    "transactionType": "CustomerPayBillOnline",
                                    "phoneNumber": '254' + phoneNumber,
                                    "amount": 1,
                                    "callbackUrl": "http://localhost:8181/payfi-success",
                                    "accountReference": "demo",
                                    "transactionDesc": "Test"
                                }
                                var reqOptions = {
                                    uri: 'http://pay.brandfi.co.ke:8301/api/stkpush',
                                    method: 'POST',
                                    body: JSON.stringify(postData),
                                    headers: {
                                        'Content-Type': 'application/json'
                                    }
                                }
                                request(reqOptions, function(err, respMessage) {
                                    if (err) console.log('error');

                                    var respM = JSON.parse(respMessage.body);
                                    var merchantRequestID = respM.merchantRequestID;
                                    var CheckoutRequestID = respM.CheckoutRequestID;
                                    var ResponseCode = respM.ResponseCode;
                                    var ResponseDescription = respM.ResponseDescription;
                                    var customerMessage = respM.CustomerMessage;
                                    req.session.CheckoutRequestID = CheckoutRequestID

                                    res.redirect('/successPremium');

                                })
                            })

                        }
                    })
                }

            });
        };
    })
});

// ##########################
// success for premium page
// ##########################
app.get('/successPremium', function(req, res) {
    // extract parameters (queries) from URL
    req.session.host = req.headers.host;
    req.session.success_time = new Date();

    // console.log("Session data at success page = " + util.inspect(req.session, false, null));

    // render sucess page using handlebars template and send in session data
    res.render('premiumsuccess', req.session);
});

app.get('/stkpushquery', function(req, res) {
    var stkQueryLoad = {
        "clientId": "2",
        "timestamp": Date.now().toString(),
        "checkoutRequestId": req.session.CheckoutRequestID
    }
    var stkQueryOptions = {
        uri: 'http://pay.brandfi.co.ke:8301/api/stkpushquery',
        method: 'POST',
        body: JSON.stringify(stkQueryLoad),
        headers: {
            'Content-Type': 'application/json'
        }
    }
    // send stkpushquery
    request(stkQueryOptions, function(err, queryRes) {
        if (err)
            res.send(err);
        queryRes = JSON.parse(queryRes.body);
        // check if request has processed and act according to result description
        if (queryRes.ResultCode) {
            if (queryRes.ResultDesc == "The service request is processed successfully.") {
                // *** redirect user to Meraki to process authentication, then send client to success_url
                res.writeHead(302, { 'Location': req.session.base_grant_url + "?continue_url=" + req.session.success_url });
                res.end();
            } else if (queryRes.ResultDesc == "[MpesaCB - ]The balance is insufficient for the transaction.") {
                req.session.mpesaError = "You don't have enough MPESA balance to complete this transaction.";
                res.render('premiumsuccess', req.session);
            } else if (queryRes.ResultDesc == "[STK_CB - ]Request cancelled by user") {
                req.session.mpesaError = "You have cancelled the transaction";
                res.render('premiumsuccess', req.session);
            }
        } else if (queryRes.errorMessage) {
            req.session.mpesaFinishError = 'Please finish transaction on phone before confirming';
            res.render('premiumsuccess', req.session);
        }

    })
})
// ##############################
// End premium spalsh page
// ###############################

// ################################################################
// Sign-on Splash Page /w RADIUS username and password
// ################################################################
// #######
// signon page
// #######
app.get('/signon', function(req, res) {

    // extract parameters (queries) from URL
    req.session.protocol = req.protocol;
    req.session.host = req.headers.host;
    req.session.login_url = req.query.login_url;
    req.session.continue_url = req.query.continue_url;
    req.session.ap_name = req.query.ap_name;
    req.session.ap_tags = req.query.ap_tags;
    req.session.client_ip = req.query.client_ip;
    req.session.client_mac = req.query.client_mac;
    req.session.success_url = req.protocol + '://' + req.session.host + "/successSignOn";
    req.session.signon_time = new Date();
    // display data for debugging purposes
    console.log("Session data at signon page = " + util.inspect(req.session, false, null));

    res.render('login', req.session);
});

app.get('/taylergray/signon', function(req, res) {
    delete req.session["fname"];
    delete req.session["lname"];
    delete req.session["mobileNumber"];
    delete req.session["smsConfirmationCode"];
    // extract parameters (queries) from URL
    req.session.protocol = req.protocol;
    req.session.host = req.headers.host;
    req.session.login_url = req.query.login_url;
    req.session.continue_url = req.query.continue_url;
    req.session.ap_name = req.query.ap_name;
    req.session.ap_tags = req.query.ap_tags;
    req.session.client_ip = req.query.client_ip;
    req.session.client_mac = req.query.client_mac;
    req.session.success_url = req.protocol + '://' + req.session.host + "/taylorClick";
    req.session.signon_time = new Date();

    // display session data for debugging purposes
    console.log("Session data at click page = " + util.inspect(req.session, false, null));

    res.render('taylorhome', req.session);
});

// #############
// success for sign on page
// #############
app.get('/successSignOn', function(req, res) {
    // extract parameters (queries) from URL
    req.session.host = req.headers.host;
    req.session.success_time = new Date();
    req.session.logout_url = req.query.logout_url;
    req.session.logout_url_continue = req.query.logout_url + "&continue_url=" + req.session.protocol + '://' + req.session.host + "/logout";
    console.log("Logout URL = " + util.inspect(req.logout_url_continue));


    console.log("Session data at success page = " + util.inspect(req.session, false, null));

    // render sucess page using handlebars template and send in session data
    res.render('successsignon', req.session);
});

// #############
// logged-out page
// #############
app.get('/logout', function(req, res) {
    // determine session duration
    req.session.loggedout_time = new Date();
    req.session.duration = {};
    req.session.duration.ms = Math.abs(req.session.loggedout_time - req.session.success_time); // total milliseconds
    req.session.duration.sec = Math.floor((req.session.duration.ms / 1000) % 60);
    req.session.duration.min = (req.session.duration.ms / 1000 / 60) << 0;

    // do something with the session data (i.e. console, database, file, etc. )
    // display data for debugging purposes
    console.log("Session data at logged-out page = " + util.inspect(req.session, false, null));

    // render sucess page using handlebars template and send in session data
    res.render('logged-out', req.session);
});

// #############
// terms of service page
// #############
app.get('/terms', function(req, res) {
    res.render('terms', req.session);
});


// ##########################
// Home page
// #########################
app.get('/', function(req, res) {
    res.render('index', req.session);
});



// #########################################
// Froala editor save page
// ############################################
app.get('/customizepage', function(req, res) {
    // set editor page to our default if he hasn't saved his
    console.log(req.session.editor_content);
    if (!req.session.editor_content) {
        fs.readFile(__dirname + "/views/partials/clickhead.hbs", "utf8", function(err, html) {
            if (err) throw err;

            req.session.editor_content = html;
            console.log(req.session.editor_content);
            res.render('customize', req.session);
        });
    } else {
        res.render('customize', req.session);
    }


});

app.post('/custompage', function(req, res) {
    // save content to session
    req.session.editor_content = req.body.editor_content;
    // Write content to Page
    fs.writeFile(__dirname + "/views/partials/clickhead.hbs", req.session.editor_content, "utf8", function(err, data) {
        if (err) throw err;

        console.log(data);
        res.render('customize', req.session);
    })

});

app.post('/image_upload', function(req, res) {

    upload_image(req, function(err, data) {

        if (err) {
            return res.status(404).end(JSON.stringify(err));
        }
        console.log(data);
        res.send(data);
    });

});

// app.get('/test', function(req, res) {
//     users.create('swiz', 'swizbeatz');

// });




// ################################################################
// Start application
// ################################################################


// define the static resources for the splash pages

app.use('/uploads', express.static(path.join(__dirname, './uploads')));
app.use(express.static('./public'));

// start web services

app.listen(port, '0.0.0.0', function() {
    console.log('Started!');
});
console.log("Server listening on port " + port);