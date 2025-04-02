const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/webshop', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("MongoDB verbunden"));

const productRoutes = require('./products');
app.use(productRoutes);

app.listen(3000, () => console.log('Server läuft auf Port 3000'));
