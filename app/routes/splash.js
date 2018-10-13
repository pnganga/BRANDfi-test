var express = require('express');
var router = express.Router();
var app = express();
var util = require('util');
var request = require('request');
var path = require('path');

var users = require('../controllers/users');
var clients = require('../controllers/clients');



// ====================================================
// WiFi Auth for Meraki clickthrough
// ====================================================

// authenticate wireless session with Cisco Meraki
router.route('/auth/wifi')
    .get(function(req, res) {
        req.session.splashlogin_time = new Date().toString();

        // debug - monitor : display all session data on console
        console.log("Session data at login page = " + util.inspect(req.session, false, null));

        // *** redirect user to Meraki to process authentication, then send client to success_url
        res.writeHead(302, { 'Location': req.session.base_grant_url + "?continue_url=" + "req.session.success_url" });
        res.end();
    });

router.route('/auth/java')
    .get(function(req, res) {
        req.session.splashlogin_time = new Date().toString();

        // debug - monitor : display all session data on console
        console.log("Session data at login page = " + util.inspect(req.session, false, null));

        // *** redirect user to Meraki to process authentication, then send client to success_url
        res.writeHead(302, { 'Location': req.session.base_grant_url + "?continue_url=" + "https://www.javahouseafrica.com" });
        res.end();
    });


// ##########################################################################################################
// Sign-on Splash Page /w RADIUS username and password(JAVA DEMO)
// ###########################################################################################################

// signon page
router.route('/signon')
    .get(function(req, res) {

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

// success for sign on page
router.route('/successSignOn')
    .get(function(req, res) {
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

// ############################################################################################################
// Splash page for premium users(JAVA DEMO)
// ###################################################################################################################
router.route('/premium')
    .get(function(req, res) {
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



    })
    // logic for handling MPESA payment for premium users

    .post(function(req, res) {
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

// success for premium page
router.route('/successPremium')
    .get(function(req, res) {
        // extract parameters (queries) from URL
        req.session.host = req.headers.host;
        req.session.success_time = new Date();
        // render sucess page using handlebars template and send in session data
        res.render('premiumsuccess', req.session);
    });

// do stk push query   
router.route('/stkpushquery')
    .get(function(req, res) {
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
// *******************************************************************************************************************************
// End premium splash page
// ******************************************************************************************************************************************

// ###################################################
// Ankole Splash Page
// ######################################################

// Serve welcome page
router.route('/ankole/signon')
    .get(function(req, res) {
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

        res.render('ankolehome', req.session);
    });

// authenticate Ankole sms user
router.route('/auth/ankole/sms')
    .post(function(req, res) {
        // check if user has an account
        var mac = req.session.client_mac;
        var org = "AnkoleSms";
        users.getOneByMacSsid(mac, org, function(err, ankoleUser) {
            if (err) res.send(err);

            if (ankoleUser.length == 0) {
                // If user does not exist, first create a password/code
                var smsConfirmationCode = Math.floor(1000 + Math.random() * 9000).toString();
                var mobileNumber = req.body.mobileNumber;
                req.session.smsConfirmationCode = smsConfirmationCode;
                req.session.mobileNumber = mobileNumber;
                var uName = mobileNumber + smsConfirmationCode;
                req.session.uName = uName;
                // Create ankole user and save to db
                users.createAnkoleUser(uName, mac, mobileNumber, org, smsConfirmationCode);

                // Send OTP PIN to user via sms

                var url = 'http://pay.brandfi.co.ke:8301/sms/send';
                var clientId = '1';
                var message = "Ankole grill: " + smsConfirmationCode + " is your WiFi access pin.";

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

                // send sms and redirect user to confirmation page

                request(clientServerOptions);
                res.redirect('/auth/ankole/confirmsms');

            } else if (ankoleUser.length > 0) {
                // if user already exists, update password and send sms
                var value = Math.floor(1000 + Math.random() * 9000).toString();
                var uName = ankoleUser[0].username;
                req.session.smsConfirmationCode = value;
                req.session.uName = uName;
                users.updateAnkoleUser(value, uName);

                // Send OTP PIN to user via sms

                var url = 'http://pay.brandfi.co.ke:8301/sms/send';
                var clientId = '1';
                var message = "Ankole grill: " + value + " is your WiFi access pin.";

                var postData = {
                    clientId: clientId,
                    message: message,
                    recepients: ankoleUser[0].mobileNumber
                }

                var clientServerOptions = {
                    uri: 'http://pay.brandfi.co.ke:8301/sms/send',
                    body: JSON.stringify(postData),
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }

                // send sms and redirect user to confirmation page

                request(clientServerOptions);
                res.redirect('/auth/ankole/confirmsms');

            }
        })

    })

// Render page for Ankole sms confirmation
router.route('/auth/ankole/confirmsms')
    .get(function(req, res) {
        res.render('ankoleconfirmsms.hbs', req.session)
    });

// success page for Ankole 
router.route('/ankoleClick')
    .get(function(req, res) {
        // extract parameters (queries) from URL
        req.session.host = req.headers.host;
        req.session.success_time = new Date();

        // render sucess page using handlebars template and send in session data
        res.render('successAnkole', req.session);
    });
// ******************************************************************************************************************************
// End of Ankole
// ********************************************************************************************************************

// ###############################################################################################################
// logged-out page
// ##############################################################################################################
router.route('/logout')
    .get(function(req, res) {
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

// ###################################################################
// voucher click logic for Java House
// #####################################################################
// serving the static click-through HTML splash page for voucher
router.route('/java-voucher')
    .get(function(req, res) {
        delete req.session.voucherErr;
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
        res.render('click-voucher', req.session);

    })
    .post(function(req, res) {
        var code = req.body.code;

        var url = 'http://178.62.86.105/validate' + '?code=' + code;
        var clientServerOptions = {
            uri: url,
            method: 'post',
        }
        // send code
        request(clientServerOptions, function(err, status) {
            if (err) {
                res.send(err);
            }
            var resp = JSON.parse(status.body);

            if (resp.resCode == 200 && resp.message == 'success') {
                // mark voucher as used
                var ur = 'http://178.62.86.105/update' + '?code=' + code;
                var clientServeOptions = {
                    uri: ur,
                    method: 'post',
                }
                request(clientServeOptions, function(err, states) {
                    var re = JSON.parse(states.body);

                    if (re.resCode == 200) {
                        res.redirect('/auth/java');
                    }
                })
            } else if (resp.resCode == 401 && resp.message == 'fail') {
                req.session.voucherErr = 'The code you entered is invalid';
                res.render('click-voucher', req.session);
            }
        });


    });


// ##################################################################################################################
// Social Login splash(Java Demo)
// ####################################################################################################################
// serving the static click-through HTML splash page for social
router.route('/click')
    .get(function(req, res) {
        delete req.session.voucherErr;
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


// success for click through page(JAVA VOUCHER)

router.route('/successClick')
    .get(function(req, res) {
        // extract parameters (queries) from URL
        req.session.host = req.headers.host;
        req.session.success_time = new Date();

        // console.log("Session data at success page = " + util.inspect(req.session, false, null));

        // render sucess page using handlebars template and send in session data
        res.render('success', req.session);
    });

// ###########################################################
// Tayler Gray sign up with sms OPTIONS
// ###########################################################

router.route('/taylergray/signon')
    .get(function(req, res) {
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
// authenticate Tayler gray sms users
router.route('/auth/sms')
    .post(function(req, res) {
        // generate confirmation code/password
        var smsConfirmationCode = Math.floor(1000 + Math.random() * 9000).toString();
        var mobileNumber = req.body.mobileNumber;
        req.session.smsConfirmationCode = smsConfirmationCode;
        req.session.mobileNumber = mobileNumber;
        // save the user to mysql
        users.create(mobileNumber, req.session.client_mac, smsConfirmationCode);
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
        // 185.17.255.134:49498
        // send sms and redirect user to confirmation page
        console.log(smsConfirmationCode);
        request(clientServerOptions);
        res.redirect('/auth/confirmsms');

    });
// Render page for Tayler Gray sms confirmation
router.route('/auth/confirmsms')
    .get(function(req, res) {
        res.render('confirmsms.hbs', req.session)
    });

router.route('/taylorClick')
    .get(function(req, res) {
        // extract parameters (queries) from URL
        req.session.host = req.headers.host;
        req.session.success_time = new Date();

        // console.log("Session data at success page = " + util.inspect(req.session, false, null));

        // render sucess page using handlebars template and send in session data
        res.render('successTaylor', req.session);
    });
// ##############################################################################################################
// Java Sms + Voucher Splash Page
// ################################################################################################################
// signon page
router.route('/java-sms-voucher')
    .get(function(req, res) {
        delete req.session.voucherErr;
        delete req.session.smsConfirmationCode;
        delete req.session.mobileNumber;
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

        res.render('sms-voucher', req.session);
    })
    .post(function(req, res) {
        // save form fields as variables
        var voucherCode = req.body.code;
        var mobileNumber = req.body.mobilenumber;

        // Check if voucher is valid
        var url = 'http://178.62.86.105/validate' + '?code=' + voucherCode;
        var clientServerOptions = {
            uri: url,
            method: 'post',
        }
        // send API request to check code validity
        request(clientServerOptions, function(err, status) {
            if (err) {
                res.send(err);
            }
            var resp = JSON.parse(status.body);
            // if code is valid
            if (resp.resCode == 200 && resp.message == 'success') {
                // mark voucher as used
                var ur = 'http://178.62.86.105/update' + '?code=' + voucherCode;
                var clientServeOptions = {
                    uri: ur,
                    method: 'post',
                }
                request(clientServeOptions, function(err, states) {
                    var re = JSON.parse(states.body);

                    if (re.resCode == 200) {
                        // check if user has an account
                        var mac = req.session.client_mac;
                        var org = "javaSmsVoucher";
                        users.getOneByMacSsid(mac, org, function(err, javaUser) {
                            if (err) res.send(err);
                            // res.send(javaUser)
                            if (javaUser.length == 0) {
                                // generate confirmation code/password
                                var smsConfirmationCode = Math.floor(1000 + Math.random() * 9000).toString();
                                req.session.smsConfirmationCode = smsConfirmationCode;
                                req.session.mobileNumber = mobileNumber;
                                var userName = mobileNumber + "-" + smsConfirmationCode;
                                req.session.userName = userName;

                                // save the user to mysql
                                users.createJavaUser(userName, req.session.client_mac, mobileNumber, org, smsConfirmationCode);
                                // Prepare sms data
                                var url = 'http://pay.brandfi.co.ke:8301/sms/send';
                                var clientId = '3';
                                var message = "JAVA HOUSE: " + smsConfirmationCode + " is your WIFI access pin";

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
                                request(clientServerOptions);
                                res.redirect("java-confirm-otp");
                            } else if (javaUser.length > 0) {
                                var value = Math.floor(1000 + Math.random() * 9000).toString();
                                var userN = javaUser[0].username;
                                req.session.smsConfirmationCode = value;
                                req.session.userName = userN;
                                users.updateJavaUser(value, userN)
                                var url = 'http://pay.brandfi.co.ke:8301/sms/send';
                                var clientId = '3';
                                var message = "JAVA HOUSE: " + value + " is your WIFI access pin";

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
                                request(clientServerOptions);
                                res.redirect('java-confirm-otp');
                            }

                        })
                    }
                })
            } else if (resp.resCode == 401 && resp.message == 'fail') {
                req.session.voucherErr = 'The code you entered is invalid';
                res.render('sms-voucher', req.session);
            }
        })

    });
router.route('/java-confirm-otp')
    .get(function(req, res) {
        console.log(req.session);
        res.render('java-confirm-otp', req.session)
    })


// ###################################################
// JAVA SMS OTP Splash PAGE
// ######################################################

// Serve welcome page
router.route('/java-sms')
    .get(function(req, res) {
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

        res.render('java-sms', req.session);
    });

// // authenticate Java sms user
router.route('/auth/java/sms')
    .post(function(req, res) {
        // check if user has an account
        var mac = req.session.client_mac;
        var org = "JavaSms";
        users.getOneByMacSsid(mac, org, function(err, javaUser) {
            if (err) res.send(err);

            if (javaUser.length == 0) {
                // If user does not exist, first create a password/code
                var smsConfirmationCode = Math.floor(1000 + Math.random() * 9000).toString();
                var mobileNumber = req.body.mobileNumber;
                req.session.smsConfirmationCode = smsConfirmationCode;
                req.session.mobileNumber = mobileNumber;
                var uName = mobileNumber + smsConfirmationCode;
                req.session.uName = uName;
                // Create ankole user and save to db
                users.createJavaUser(uName, mac, mobileNumber, org, smsConfirmationCode);

                // Send OTP PIN to user via sms

                var url = 'http://pay.brandfi.co.ke:8301/sms/send';
                var clientId = '3';
                var message = "Java house: " + smsConfirmationCode + " is your WiFi access pin.";

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

                // send sms and redirect user to confirmation page

                request(clientServerOptions);
                res.redirect('/auth/java/confirmsms');

            } else if (javaUser.length > 0) {
                // if user already exists, update password and send sms
                var value = Math.floor(1000 + Math.random() * 9000).toString();
                var uName = javaUser[0].username;
                req.session.smsConfirmationCode = value;
                req.session.userName = uName;
                users.updateJavaSmsUser(value, uName);

                // Send OTP PIN to user via sms

                var url = 'http://pay.brandfi.co.ke:8301/sms/send';
                var clientId = '3';
                var message = "Java House: " + value + " is your WiFi access pin.";

                var postData = {
                    clientId: clientId,
                    message: message,
                    recepients: javaUser[0].mobileNumber
                }

                var clientServerOptions = {
                    uri: 'http://pay.brandfi.co.ke:8301/sms/send',
                    body: JSON.stringify(postData),
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }

                // send sms and redirect user to confirmation page

                request(clientServerOptions);
                res.redirect('/auth/java/confirmsms');

            }
        })

    })

// Render page for Ankole sms confirmation
router.route('/auth/java/confirmsms')
    .get(function(req, res) {
        res.render('java-confirm-otp', req.session)
    });



module.exports = router;