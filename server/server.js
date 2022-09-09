
/* -------------- */
/* Import Modules */
/* -------------- */
require('dotenv').config();

// module refs
const express = require('express');
//
const { serverSettings } = require('../settings');
const path = require('path');
const lib = require('../lib/helpers');
const routes = require('./routes');

/* ------------------------- */
/* App Set-Up and Middleware */
/* ------------------------- */
const app = express();
const PORT = process.env.PORT || serverSettings.port;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../client')));

app.use(routes);

/* ------------ */
/* Start Server */
/* ------------ */
(async () => {
    // wait for database sync
    // ...

    // set server listening
    app.listen(PORT, err => {
        if (err) throw err;
        console.log('Server running on port:', PORT)
    });

    // plant seeds
    // ...
})();

