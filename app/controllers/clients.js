var db = require('../../db.js')

// db schema;
// client_id INT auto_increment,
// fname VARCHAR(20),
//     lname VARCHAR(20),
//     email VARCHAR(30),
//     company VARCHAR(20),
//     venue VARCHAR(20),
//     primary key(client_id

        exports.create = function(fName, lName, email, mobileNumber, company, venue, pass) {
            var values = [fName, lName, email, mobileNumber, company, venue];

            db.get().query('INSERT INTO clients (fName, lName, email, mobileNumber, company, venue) VALUES(?, ?, ?, ?, ?, ?)', values, function(err, result) {
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