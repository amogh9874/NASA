// 🔌 Dependencies
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');

// 🚀 App Setup
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname))); // Serves HTML/CSS/JS from current folder

// 🌌 MongoDB Connection
mongoose.connect('mongodb://127.0.0.1:27017/space_drifters', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.error('MongoDB connection error:', err);
});

// 👤 User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

// 🛠️ Sign-In Route (Registration)
app.post('/sign-in', async (req, res) => {
  const { email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.send('User already exists. Please log in.');

    const newUser = new User({ email, password });
    await newUser.save();
    res.send('Account created successfully!');
  } catch (err) {
    console.error('Sign-in error:', err);
    res.status(500).send('Error during sign-in.');
  }
});

// 🔐 Login Route (Authentication)
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.send('No account found. Please sign in first.');
    if (user.password !== password) return res.send('Incorrect password.');

    res.redirect('/weather.html');
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).send('Server error during login.');
  }
});

// 🛰️ Start Server
app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
