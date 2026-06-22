const path = require('path');
const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const passport = require('./config/passport');
const env = require('./config/env');
const localsMiddleware = require('./middleware/locals');
const csrfMiddleware = require('./middleware/csrf');
const errorHandler = require('./middleware/errorHandler');
const routes = require('./routes');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));

app.set('trust proxy', 1);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use('/public', express.static(path.join(__dirname, '..', 'public')));
app.use('/uploads/public', express.static(path.join(__dirname, '..', 'uploads', 'public')));
// /uploads/private is intentionally never statically served — ID cards
// are only reachable through an authenticated admin route.

app.use(session({
  store: new SQLiteStore({
    db: 'sessions.sqlite',
    dir: path.join(__dirname, '..', 'data')
  }),
  name: 'mghagha.sid',
  secret: env.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(localsMiddleware);
app.use(csrfMiddleware);

app.use('/', routes);

app.use((req, res) => {
  res.status(404).render('errors/error', {
    title: 'الصفحة غير موجودة',
    message: 'الصفحة التي تبحث عنها غير موجودة.'
  });
});

app.use(errorHandler);

module.exports = app;
