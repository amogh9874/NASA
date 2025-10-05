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

    const hashedPassword = await bcrypt.hash(password, 10);
const newUser = new User({ email, password: hashedPassword });

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
    const match = await bcrypt.compare(password, user.password);
if (!match) return res.send('Incorrect password.');


    res.redirect('/calendar.html');
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).send('Server error during login.');
  }
});

// 🛰️ Start Server
app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});

const bcrypt = require('bcrypt');

// 🔐 Change Password Route
app.post('/change-password', async (req, res) => {
  const { email, currentPassword, newPassword } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.send('User not found.');

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return res.send('Current password is incorrect.');

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedNewPassword;
    await user.save();

    res.send('Password updated successfully!');
  } catch (err) {
    console.error('Password change error:', err);
    res.status(500).send('Server error during password update.');
  }
});