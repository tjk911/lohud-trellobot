var gulp = require('gulp');
var $    = require('gulp-load-plugins')();

var express = require('express')
  , logger = require('morgan')
  , app = express()
  , port = process.env.PORT || 8080
  , Trello = require('node-trello')
  , t = new Trello("0bd8e533367e8afab34542339c5c7df2", "4583bd49db01566af73b645f661d19ab8145ffc98f60ab6a5a493ec91a69fe35")
  , Slack = require('node-slack')
  , bodyParser = require('body-parser')
  , mailer = require('./mailer')
  , url = require('url')
  , http = require('http')
  , credentials = require('./credentials')

var sassPaths = [
  'static/bower_components/foundation-sites/scss',
  'static/bower_components/motion-ui/src'
];

gulp.task('sass', function() {
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

gulp.task('default', ['sass'], function() {
  gulp.watch(['scss/**/*.scss'], ['sass']);
});


var slack = new Slack(credentials.webhookUri);

var currentLength = 0;
var currentAssets = [];

// URL arguments are passed in as an object.
function grab() {
  t.get(
    "/1/lists/559ea8976fe031f2e5147baa/cards", { 
      // filter: "open", 
      // limit: "1" 
    }, 
    function(err, data) {
      if (err) throw err;
      
      // Check to see if there are changes
      if (currentLength == data.length) {
        // console.log("Don't do anything");
      } else {
        
        // Update the base length
        currentLength = data.length;
        var newAssets = [];

        // Loop through the list
        for (var i = 0; i < data.length; i++){
          // Check if list is push-worthy
          if (i > 0) {
            newAssets.push(data[i]['name']);

            // Check if it exists in assets
            if (currentAssets.indexOf(data[i]['name']) > -1) {
              // console.log('found it')
            } else {
              // console.log(assets.indexOf(data[i]['name']))
              // console.log('does not exist, so we are pushing and announcing')
              currentAssets.push(data[i]['name']);
              slack.send({
                  text: "`"+data[i]['name']+'` is ready',
                  channel: '#trellotest',
                  username: 'Hypnotoad',
                  icon_emoji: ':hypnotoad:',
                  // attachments: attachment_array,
                  // unfurl_links: true,
                  // link_names: 1
              });

              // slack.webhook({
              //   channel: "#trellotest",
              //   username: "Hypnotoad",
              //   icon_emoji: ":hypnotoad:",
              //   text: "`"+data[i]['name']+'` is ready'
              // }, function(err, response) {
              //   console.log(response);
              // });
            }
          }
        }
        // End loop through the list

        // Loop through the asset
        for (var x = 0; x < currentAssets.length; x++){
          var assetpos = newAssets.indexOf(currentAssets[x]);
          // console.log(assetpos);
          // console.log(newAssets[assetpos]);
          // console.log("should match");
          // console.log(currentAssets[x]);
          // check if assets exist in data
          if (newAssets.indexOf(currentAssets[x]) > -1){
            // console.log(currentAssets[x]+' is still here')
          } else {
            // console.log(currentAssets[x]+' is now gone')
            slack.send({
                text: "`"+currentAssets[x]+'` has been posted',
                channel: '#trellotest',
                username: 'Hypnotoad',
                icon_emoji: ':hypnotoad:',
            }, function(err, response){
              // console.log(response);
              currentAssets = newAssets;
            });
          }
        }
        // end loop through the asset
      }
      
    }
  );
  // set refresh frequency
  setTimeout(grab, 2000);
};

grab();

app.use(logger('dev'))
app.use(express.static(__dirname + '/static'))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Tell app to use jade
app.set('view engine', 'jade');

app.get('/', function (req, res, next) {
  try {
    res.render('homepage', {
      title : 'Trellobot | lohud.com',
      auth: authHelper.getAuthUrl()
    });
  } catch (e) {
    next(e)
  }
})

app.get('/authorize', function (req, res) {
  var url_parts = url.parse(req.url, true);
  var code = url_parts.query.code;
  var token = authHelper.getTokenFromCode(code, mailer.tokenReceived, res);
  console.log("Code: " + code);
  console.log("Request handler 'authorize' was called.");
})

app.get('/mail', mailer.checkMail)


app.post('/post',function(req,res) {

  // Grab the message and user
  var allResponse = slack.respond(req.body, function(hook){
    return rawmessage = hook.text,
           user = hook.user_name
  });

  // Clean up the message
  message = rawmessage.replace('trellocomplete','')

  // t.get(
  //   "/1/lists/559ea8976fe031f2e5147baa/cards", { 
  //     // filter: "open", 
  //     // limit: "1" 
  //   }, 
  //   function(err, data) {
  //     if (err) throw err;
      
  //     // Loop through the list
  //     for (var i = 0; i < data.length; i++){
  //       // Check if list is push-worthy
  //       if (i > 0) {

  //       }
  //     }
  //     // End loop through the list

      
  //   }
  // );

    var reply =  {
            text: 'text = ' + message + '; user = ' + user,
            username: 'Hypnotoad',
            icon_emoji: ':hypnotoad:',
        };

    res.json(reply);

});


// LISTEN!
app.listen(port, "localhost")

