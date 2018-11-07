var db = require('../../db.js');


exports.create = function(name, location, country, aps, smsSplash, socialSplash, voucherSplash, voucherSmsSplash, usernamePasswordSplash) {
    var values = [name, location, country, aps, smsSplash, socialSplash, voucherSplash, voucherSmsSplash, usernamePasswordSplash];

    db.get().query('INSERT INTO franchises (name, location, country, aps, smsSplashPage, socialSplashPage, voucherSplashPage, voucherSmsSplashPage, usernamePasswordSplashPage) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)', values, function(err, result) {
        if (err) console.log(err);
        console.log(result);
    })

}

exports.getAll = function(done) {
    db.get().query('SELECT * FROM franchises', function(err, rows) {
        if (err) console.log(err);
        done(null, rows)
    })
}

exports.getOne = function(code, done) {
    var value = [code]
    db.get().query('SELECT * FROM franchises WHERE value = ?', value, function(err, row) {
        if (err) console.log(err);
        done(null, row)
    });
}

exports.getAllByUser = function(name, done) {
    db.get().query('SELECT * FROM franchises WHERE name = ?', name, function(err, rows) {
        if (err) return done(err)
        done(null, rows)
    })
}