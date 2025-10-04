const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'))); // Serve HTML/CSS

app.post('/login', (req, res) => {
  const { email, password } = req.body;

  // Replace with real authentication logic
  if (email === 'drifter@space.com' && password === 'orbit123') {
    res.redirect('/index.html'); // Redirect to weather page
  } else {
    res.send('Invalid credentials. Try again.');
  }
});


app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});

app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, 'public')));
