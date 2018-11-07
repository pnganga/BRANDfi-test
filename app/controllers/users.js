var db = require('../../db.js')

exports.create = function(userName, macAdress,  pass) {
    var values = [userName, macAdress,'Cleartext-Password', ":=", pass];

    db.get().query('INSERT INTO radcheck (username, macAdress, attribute, op, value) VALUES(?, ?, ?, ?, ?)', values, function(err, result) {
        if (err) console.log(err);
 		console.log(result);
        
    })
}

exports.createJavaUser = function(userName, macAdress, mobileNumber, ssid,  pass) {
    var values = [userName, macAdress, mobileNumber, ssid, 'Cleartext-Password', ":=", pass];

    db.get().query('INSERT INTO radcheck (username, macAdress, mobileNumber, ssid, attribute, op, value) VALUES(?, ?, ?, ?, ?, ?, ?)', values, function(err, result) {
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

exports.createAnkoleUser = function(userName, macAdress, mobileNumber, ssid,  pass) {
    var values = [userName, macAdress, mobileNumber, ssid, 'Cleartext-Password', ":=", pass];

    db.get().query('INSERT INTO radcheck (username, macAdress, mobileNumber, ssid, attribute, op, value) VALUES(?, ?, ?, ?, ?, ?, ?)', values, function(err, result) {
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
    db.get().query('SELECT * FROM radcheck WHERE macAdress = ? AND ssid = ?', values, function(err, row) {
        if (err) console.log(err);
        done(null, row)
    });
}

exports.getOneByMac = function(mac, done) {
	var value = [mac]
    db.get().query('SELECT * FROM radcheck WHERE macAdress = ?', value, function(err, row) {
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