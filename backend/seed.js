const mongoose = require('mongoose');
const Product = require('./product');

mongoose.connect('mongodb://localhost:27017/webshop')
  .then(() => {
    console.log('📦 Verbunden mit MongoDB');
    return Product.insertMany([
      {
        name: 'T-Shirt',
        price: 19.99,
        description: 'Comfortable cotton t-shirt',
        category: 'Clothing'
      },
      {
        name: 'Sneakers',
        price: 59.99,
        description: 'Running shoes with good grip',
        category: 'Footwear'
      },
      {
        name: 'Backpack',
        price: 34.99,
        description: 'Durable travel backpack',
        category: 'Accessories'
      }
    ]);
  })
  .then(() => {
    console.log('✅ Produkte erfolgreich gespeichert');
    mongoose.connection.close();
  })
  .catch((err) => console.error('❌ Fehler:', err));
