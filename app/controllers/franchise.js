var db = require('../../db.js');


exports.create = function(name, location, country, aps, smsSplash, socialSplash, voucherSplash, voucherSmsSplash, usernamePasswordSplash) {
    var values = [name, location, country, aps, smsSplash, socialSplash, voucherSplash, voucherSmsSplash, usernamePasswordSplash];

    db.get().query('INSERT INTO fanchise (name, location, country, aps, smsSplashPage, socialSplashPage, voucherSplashPage, voucherSmsSplashPage, usenamePasswordSplashPage) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)', values, function(err, result) {
        if (err) console.log(err);
        console.log(result);
    })

}

exports.getAll = function(done) {
    db.get().query('SELECT * FROM radcheck', function(err, rows) {
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