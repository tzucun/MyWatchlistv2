const mysql = require('mysql');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'mywatchlist'
});

db.connect((err) => {
    if (err) {
        console.error('Gagal terhubung ke Database', err);
        return;
    }
    console.log('Berhasil terhubung ke Database');
});

module.exports = db;