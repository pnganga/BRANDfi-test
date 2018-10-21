var db = require('../../db.js')

exports.create = function(userName, macAddress,  pass) {
    var values = [userName, macAddress,'Cleartext-Password', ":=", pass];

    db.get().query('INSERT INTO radcheck (username, macAddress, attribute, op, value) VALUES(?, ?, ?, ?, ?)', values, function(err, result) {
        if (err) console.log(err);
 		console.log(result);
        
    })
}

exports.createJavaUser = function(userName, macAddress, mobileNumber, ssid,  pass) {
    var values = [userName, macAddress, mobileNumber, ssid, 'Cleartext-Password', ":=", pass];

    db.get().query('INSERT INTO radcheck (username, macAddress, mobileNumber, ssid, attribute, op, value) VALUES(?, ?, ?, ?, ?, ?, ?)', values, function(err, result) {
        if (err) console.log(err);
 		console.log(result);
 		
        
    })
}
exports.updateJavaUser = function(code, userName) {
    var values = [code, userName];
    db.get().query('UPDATE radcheck SET value= ? WHERE username= ?', values, function(err, result) {
        if (err) console.log(err);
 		console.log(result + "User updated");
        
    })
}

exports.updateJavaSmsUser = function(code, userName) {
    var values = [code, userName, "JavaSms"];
    db.get().query('UPDATE radcheck SET value= ? WHERE username= ? AND ssid= ?', values, function(err, result) {
        if (err) console.log(err);
 		console.log(result + "User updated");
        
    })
}

exports.createAnkoleUser = function(userName, macAddress, mobileNumber, ssid,  pass) {
    var values = [userName, macAddress, mobileNumber, ssid, 'Cleartext-Password', ":=", pass];

    db.get().query('INSERT INTO radcheck (username, macAddress, mobileNumber, ssid, attribute, op, value) VALUES(?, ?, ?, ?, ?, ?, ?)', values, function(err, result) {
        if (err) console.log(err);
 		console.log(result);
 		
        
    })
}

exports.updateAnkoleUser = function(code, userName) {
    var values = [code, userName, "AnkoleSms"];
    db.get().query('UPDATE radcheck SET value= ? WHERE username= ? AND ssid= ?', values, function(err, result) {
        if (err) console.log(err);
 		console.log(result + "User updated");
        
    })
}

exports.getAll = function(done) {
	var value = ["javaSms", "javaSmsVoucher"]
    db.get().query('SELECT * FROM radcheck WHERE ssid in (?, ?)', value, function(err, rows) {
        if (err) console.log(err);
        done(null, rows)
    })
}

exports.getOne = function(code, done) {
	var value = [code]
    db.get().query('SELECT * FROM radcheck WHERE value = ?', value, function(err, row) {
        if (err) console.log(err);
        done(null, row)
    });
}
exports.getOneByMacSsid = function(mac, ssid, done) {
	var values = [mac, ssid]
    db.get().query('SELECT * FROM radcheck WHERE macAddress = ? AND ssid = ?', values, function(err, row) {
        if (err) console.log(err);
        done(null, row)
    });
}

exports.getOneByMac = function(mac, done) {
	var value = [mac]
    db.get().query('SELECT * FROM radcheck WHERE macAddress = ?', value, function(err, row) {
        if (err) console.log(err);
        done(null, row)
    });
}

exports.getAllByUser = function(userId, done) {
    db.get().query('SELECT * FROM comments WHERE user_id = ?', userId, function(err, rows) {
        if (err) return done(err)
        done(null, rows)
    })
}