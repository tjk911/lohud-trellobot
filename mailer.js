var outlook = require('node-outlook')
  , authHelper = require('./authHelper')
  , Slack = require('node-slack')
  , credentials = require('./credentials')
  , outlook_refresh = require('outlook-refresh')
  , moment = require('moment-timezone')

var slack = new Slack(credentials.webhookUri);
var savedToken;
var savedEmail;
var refreshToken;
var alertCounter = 0;

// Use below for stage/prod
var momenttime = moment().tz("America/Los_Angeles").format();

// Use below for dev
// var momenttime = moment().tz("America/New_York").format();

console.log('this is momenttime', momenttime);

var savedTime = momenttime;

var refresh = function(){
  outlook_refresh(refreshToken, credentials.oauthcredID, credentials.oauthcredSecret, function (err, res){
    if (err){
      console.log('refresh error: ',err);
    } else {
      savedToken = res.token;
      console.log('refresh triggered')
    }
  }); 
  setTimeout(refresh, 180000); // 1000 = 1 sec, currently 30 mins
};

var tokenReceived = function(res, error, token) {
      if (error) {
        console.log("Access token error: ", error.message);
      }
      else {
        savedToken = token.token.access_token;
        savedEmail = authHelper.getEmailFromIdToken(token.token.id_token);
        refreshToken = token.token.refresh_token;
        console.log(token);
        // Use below for stage/prod
        res.redirect(302, 'https://data.lohud.com/bots/trellobot/');
        // Use below for dev
        // res.redirect(302, 'http://localhost:8080/');
        res.end();
      }
};

var getValueFromCookie = function(valueName, cookie) {
  if (cookie.indexOf(valueName) !== -1) {
    var start = cookie.indexOf(valueName) + valueName.length + 1;
    var end = cookie.indexOf(';', start);
    end = end === -1 ? cookie.length : end;
    return cookie.substring(start, end);
  }
};

var checkMail = function(req, res) {

  // Use below for stage/prod
  var date = moment().tz("America/Los_Angeles").format();

  // Use below for dev
  // var date = moment().tz("America/New_York").format();

  t = new Date();

  if (savedToken) {
    var queryParams = {
      '$filter':"ReceivedDateTime ge "+savedTime+" and From/EmailAddress/Address eq 'noreply.ap@notification.ap.org'",
      '$select': 'Subject,ReceivedDateTime,From',
      '$orderby': 'ReceivedDateTime desc',
      // '$top': 10
      // '$search': '"from:noreply.ap@notification.ap.org"'
    };
    
    // Set the API endpoint to use the v2.0 endpoint
    outlook.base.setApiEndpoint('https://outlook.office.com/api/v2.0');
    // Set the anchor mailbox to the user's SMTP address
    // Throwing errors for some reason
    // outlook.base.setAnchorMailbox(savedEmail);
    
    outlook.mail.getMessages({token: savedToken, odataParams: queryParams},
      function(error, result){
        if (error) {
          console.log('getMessages returned an error: ' + error);
        } else if (result) {
          var inbox = result['value'];
          console.log(inbox);
          for (var x = 0; x < inbox.length; x++) {
            slack.send({
                  // username: 'Skepti-Kai',
                  // text: "`Kaitest:` *"+inbox[x]['Subject']+'*',
                  // icon_emoji: ':notsureif:',
                  username: 'Associated Press',
                  text: "`AP NOTIFICATION:` *"+inbox[x]['Subject']+'*',
                  icon_emoji: ':Deathstar:',
                  channel: '#trellotest',
            });
          }
        }
      });
  }
  else {
    console.log(t, 'mailer.js broke!');
    alertCounter ++;
    if (alertCounter == 30){
      alertCounter = 0;
      slack.send({
        username: 'OutlookBot',
        text: "Our outlook authentication is dead! Please re-login at `http://data.lohud.com/bots/trellobot` with our digital@gannett.com account!",
        icon_emoji: ':calculon',
        channel: '#trellotest',
      })
    };
  }
  // setTimeout(checkMail, 100000); // 10 secs
  setTimeout(checkMail, 10000);
  console.log(t, 'mail pinged');
  console.log(date);
  console.log(savedTime);
  savedTime = date;
};

module.exports = {
  tokenReceived: tokenReceived,
  getValueFromCookie: getValueFromCookie,
  checkMail: checkMail,
  refresh: refresh
}