var db = require('../../db.js');
var bcrypt = require('bcrypt');

exports.create = function(fName, lName, email, mobileNumber, franchiseName, pass) {
    bcrypt.hash(pass, 2, function(err, hash) {
        pass = hash;
        console.log(pass);
        var values = [fName, lName, email, mobileNumber, franchiseName, pass];

        db.get().query('INSERT INTO clients (fName, lName, email, mobileNumber, franchiseName, password) VALUES(?, ?, ?, ?, ?, ?)', values, function(err, result) {
            if (err) console.log(err);
            console.log(result);

        })
    });

}

exports.getAll = function(done) {
    db.get().query('SELECT * FROM radcheck', function(err, rows) {
        if (err) console.log(err);
        done(null, rows)
    })
}

exports.getOneByEmail = function(email, done) {
    var value = [email]
    db.get().query('SELECT * FROM clients WHERE email = ?', value, function(err, row) {
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