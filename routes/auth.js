const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');
  res.redirect('/login');
});

router.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');
  res.render('login', { title: '登入', error: null });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const validUser = username === process.env.ADMIN_USERNAME;
  const validPass = password === process.env.ADMIN_PASSWORD;

  if (validUser && validPass) {
    req.session.user = { username };
    return res.redirect('/dashboard');
  }

  res.render('login', { title: '登入', error: '用戶名或密碼不正確' });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

module.exports = router;
