const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const PORT = process.env.PORT || 8000;
const app = express();

/* Connect to Mongod server. */
const db = mongoose.connection;
db.on('error', console.error);
db.once('open', () => {
  console.log('Connected to mongod server');
});
mongoose.connect('mongodb://localhost/paperplane');

/* Middleware settings. */
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

/* Routes settings. */
require('./routes')(app);

/* Start listening to given port. */
app.listen(PORT, () => {
  console.log(`Server running at http://127.0.0.1:${PORT}`);
});
