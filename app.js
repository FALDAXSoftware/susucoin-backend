var express = require('express');
var fs = require('fs')
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var cors = require('cors');
var dotenv = require('dotenv');
var app = express();
var https = require('https');
var http = require('http');
var i18n = require("i18n");
const Validator = require('node-input-validator');
var session = require('express-session')
var cron = require('node-cron');
// var coinController = require("./controllers/v1/CoinsController")

app.use(cors())

dotenv.load(); // Configuration load (ENV file)
// Configure Locales
i18n.configure({
  locales: ['en', 'de'],
  directory: __dirname + '/locales',
  register: global
});

app.use(i18n.init);

// Json parser
app.use(bodyParser.json({
  limit: "2.7mb",
  extended: false
}));
app.use(bodyParser.urlencoded({
  limit: "2.7mb",
  extended: false
}));



app.all('/*', function (req, res, next) {
  // CORS headers
  res.header("Access-Control-Allow-Origin", "*"); // restrict it to the required domain
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  // Set custom headers for CORS
  res.header('Access-Control-Allow-Headers', 'Content-type,Accept,X-Access-Token,X-Key,Client-Key,x-token');
  if (req.headers.language) { // If header send language, then set to that language
    i18n.setLocale(req.headers.language);
  }
  console.log(req.headers["x-token"])
  if (req.headers["x-token"] != "faldax-susucoin-node") {
    res
      .status(403)
      .json({ status: 403, message: ("Unauthorized access") });
  }
  if (req.method == 'OPTIONS') {
    res
      .status(200)
      .end();
  } else {
    next();
  }
});



var server = http.createServer(app);

//Routes
app.use('/', require('./routes'));
app.use(function (req, res, next) {
  var err = new Error('Resource Not Found');
  err.status = 404;
  var resources = {};
  res.status(404);
  resources.status = err.status;
  resources.message = err.message;
  return res.json(resources);
});


// process.on('uncaughtException', function (error) {}); // Ignore error

// Start the server
app.set('port', process.env.PORT);
server.listen(app.get('port'), function () {
  console.log(process.env.PROJECT_NAME + " Application is running on " + process.env.PORT + " port....");
});

var cronjobFile = require("./services/cronJobs");