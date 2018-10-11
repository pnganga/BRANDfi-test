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
var clients = require('./app/controllers/clients');

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





var splashRoutes = require('./app/routes/splash');
app.use(splashRoutes);

var authRoutes = require('./app/routes/auth');
app.use(authRoutes);

var coreRoutes = require('./app/routes/core');
app.use(coreRoutes);

var clientRoutes = require('./app/routes/client');
app.use(clientRoutes);

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