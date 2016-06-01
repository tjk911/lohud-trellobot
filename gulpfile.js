var gulp = require('gulp');
var $    = require('gulp-load-plugins')();

var express = require('express')
  , logger = require('morgan')
  , app = express()
  , port = process.env.PORT || 8080
  , url = require('url')
  , http = require('http')
  , bodyParser = require('body-parser')
  , mailer = require('./mailer')
  , credentials = require('./credentials')
  , bot = require('./bot')
  , authHelper = require('./authHelper')
  , trello = require('./trello')

var sassPaths = [
  'static/bower_components/foundation-sites/scss',
  'static/bower_components/motion-ui/src'
];

gulp.task('sass', function(){
  return gulp.src('scss/app.scss')
    .pipe($.sass({
      includePaths: sassPaths
    })
      .on('error', $.sass.logError))
    .pipe($.autoprefixer({
      browsers: ['last 2 versions', 'ie >= 9']
    }))
    .pipe(gulp.dest('static/css'));
});

gulp.task('default', ['sass'], function(){
  gulp.watch(['scss/**/*.scss'], ['sass']);
});

// date = Date();

// text = 'The bot crashed at: ' + date;
// channel = '#trellotest';
// username =  'Bender';
// emoji = ':Bender:';

// bot.sendMessage(text, channel, username, emoji);

trello.grab();
mailer.refresh();
mailer.checkMail();

app.use(logger('dev'))
app.use(express.static(__dirname + '/static'))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Tell app to use jade
app.set('view engine', 'jade');

app.get('/', function (req, res, next){
  try {
    res.render('homepage', {
      title : 'Trellobot | lohud.com',
      auth: authHelper.getAuthUrl()
    });
  } catch (e){
    next(e)
  }
})

app.get('/authorize', function (req, res){
  var url_parts = url.parse(req.url, true);
  var code = url_parts.query.code;
  var token = authHelper.getTokenFromCode(code, mailer.tokenReceived, res);
  // console.log("Code: " + code);
  // console.log("Request handler 'authorize' was called.");
})

app.post('/post',function(req,res){

  // Grab the message and user
  // var allResponse = credentials.slack.respond(req.body, function(hook){
  //   return rawmessage = hook.text,
  //          user = hook.user_name
  // });

  var response = req.body;
  console.log(response);

  // Clean up the message
  message = response['text'].replace(response['trigger_word'] + ' ','').toLowerCase();
  channel = "#" + response['channel_name'];

  console.log(message);
  bot.parseCommands(message, channel);

});

// LISTEN!
app.listen(port, "localhost")