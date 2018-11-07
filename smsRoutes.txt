var express = require('express');
var router = express.Router();
var app = express();
var util = require('util');
var request = require('request');
var path = require('path');

var users = require('../../app/controllers/users');
var clients = require('../../app/controllers/clients');

class SmsController {

    constructor(router) {
        router.get('/sms', this.get.bind(this));
    }
    // Serve welcome page
    get(req, res) {
        // clear mobileNumber and code in sesssion if it exists
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
        req.session.success_url = req.protocol + '://' + req.session.host + "/ankoleClick";
        req.session.signon_time = new Date();

        // display session data for debugging purposes
        console.log("Session data at click page = " + util.inspect(req.session, false, null));

        res.render('franchiseViews/' + req.session.ap_tags.toLowerCase() + "/SMS/SmsSplashWelcome", req.session);
    }
}



module.exports = SmsController;
