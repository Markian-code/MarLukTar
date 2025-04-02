const express = require('express');
const router = express.Router();
const Product = require('./product');

router.get('/products', async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

module.exports = router;

