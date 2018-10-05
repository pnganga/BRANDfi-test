var db = require('../../db.js')

exports.create = function(userName, pass) {
    var values = [userName,'Cleartext-Password', ":=", pass];

    db.get().query('INSERT INTO radcheck (username, attribute, op, value) VALUES(?, ?, ?, ?)', values, function(err, result) {
        if (err) console.log(err);
 		console.log(result);
        
    })
}

exports.getAll = function(done) {
    db.get().query('SELECT * FROM comments', function(err, rows) {
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

exports.getAllByUser = function(userId, done) {
    db.get().query('SELECT * FROM comments WHERE user_id = ?', userId, function(err, rows) {
        if (err) return done(err)
        done(null, rows)
    })
}