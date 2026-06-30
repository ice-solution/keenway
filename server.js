require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const methodOverride = require('method-override');
const path = require('path');
const connectDB = require('./config/db');
const { requireAuth } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  app.set('trust proxy', 1);
}

connectDB();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'keenway-secret',
    resave: false,
    saveUninitialized: false,
    proxy: isProduction,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      ttl: 60 * 60 * 24 * 7,
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7,
      httpOnly: true,
      sameSite: 'lax',
      secure: isProduction,
    },
  })
);

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.domain = process.env.DOMAIN || `http://localhost:${PORT}`;
  res.locals.currentPath = req.path;
  next();
});

app.use('/', require('./routes/auth'));
app.use('/dashboard', requireAuth, require('./routes/dashboard'));
app.use('/locations', requireAuth, require('./routes/locations'));
app.use('/diffusers', requireAuth, require('./routes/diffusers'));
app.use('/records', requireAuth, require('./routes/records'));

app.use((req, res) => {
  res.status(404).render('error', { title: '找不到頁面', message: '您請求的頁面不存在。' });
});

app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).render('error', { title: '系統錯誤', message: '發生未預期的錯誤，請稍後再試。' });
});

app.listen(PORT, () => {
  console.log(`Keenway 管理系統運行於 ${process.env.DOMAIN || `http://localhost:${PORT}`}`);
});
