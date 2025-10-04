const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/space_drifters');

const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

const User = mongoose.model('User', userSchema);

User.find().then(users => {
  console.log('All users:');
  users.forEach(user => {
    console.log(`Email: ${user.email}, Password: ${user.password}`);
  });
  mongoose.disconnect();
});
