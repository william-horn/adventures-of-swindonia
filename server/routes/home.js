// const axios = require('axios');
const router = require('express').Router();
const path = require('path');

const GET_root = (req, res) => {
    res.status(200).sendFile(path.join(__dirname, '../../client/game.html'));
}

const POST_root = (req, res) => {}
const PUT_root = (req, res) => {}
const DELETE_root = (req, res) => {}

// * example root url: localhost:port/
router
    .route('/')
    .get(GET_root)
    .post(POST_root)
    .put(PUT_root)
    .delete(DELETE_root)

module.exports = router;


