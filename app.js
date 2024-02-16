require("./config/config");

const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const { engine } = require('express-handlebars');
const passport = require('passport');
const flash = require('connect-flash');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
require('./middlewares/passport')(passport);

const indexRouter = require('./routes/index');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('hbs', engine({ extname: 'hbs', defaultLayout: 'layout', layoutsDir: path.join(__dirname, 'views', 'layouts'), partialsDir: path.join(__dirname, 'views', 'partials') }));
app.set('view engine', 'hbs');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(flash())
app.use(session({
  // cookie: { maxAge: +process.env.JWT_EXPIRATION, secure: false },
  secret: process.env.APP_PASSWORD,
  resave: true,
  saveUninitialized: true,
  store: new FileStore({
    path: path.join(__dirname, 'sessions')
  })
}));
app.use(passport.initialize())
app.use(passport.session())

app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = process.env.phase === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
