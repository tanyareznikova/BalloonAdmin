var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var expressHbs = require("express-handlebars");
var mongoose = require("mongoose");

//var indexRouter = require('./routes/index');
var scraperRouter = require('./routes/panel/scraper');
var usersRouter = require('./routes/users');

var app = express();

const OPTS = {
  family: 4,
  useNewUrlParser: true,
  useFindAndModify: false,
  useCreateIndex: true
};

//mongoose.connect('mongodb://localhost:27017/RedBalloonDB', { useNewUrlParser: true })
mongoose.connect('mongodb://localhost/BalloonDB', OPTS)
    .then(() =>  console.log('Успешное подключение'))
    .catch((err) => console.error(err));

// view engine setup
//app.engine(".hbs", expressHbs({defaultLayout: __dirname + '/views/productScraper/layouts/layout.hbs'}));
//app.engine(".hbs", expressHbs({ defaultLayout: "layout", extname: ".hbs" }));

app.engine('.hbs', expressHbs({extname: '.hbs', defaultLayout: 'layout',
  partialsDir: path.join(__dirname, '/views/productScraper/partials'),
  layoutsDir: path.join(__dirname, '/views/productScraper/layouts')}));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//app.use('/', indexRouter);
app.use('/', scraperRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
