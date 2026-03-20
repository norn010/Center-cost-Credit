const express = require('express');
const { getAvailableDatabases } = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  res.json(getAvailableDatabases());
});

module.exports = router;
