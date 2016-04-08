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

// Use below for stage/prod
var momenttime = moment().tz("America/Los_Angeles").format();

// Use below for dev
// var momenttime = moment().tz("America/New_York").format();

console.log('this is momenttime', momenttime);

Date.prototype.yyyymmdd = function() {
  var yyyy = this.getFullYear().toString();
  var mm = (this.getMonth()+1).toString(); // getMonth() is zero-based
  var dd  = this.getDate().toString();
  var hr = (this.getHours()+4).toString();
  var mn = this.getMinutes().toString();
  var sc = this.getSeconds().toString();
  return yyyy + (mm[1]?mm:"0"+mm[0]) + (dd[1]?dd:"0"+dd[0]) + hr + mn + sc; // padding
};

var sT = new Date();

var rn = sT.yyyymmdd().toString();
  var rnYear = rn.substring(0,4);
  var rnMonth = rn.substring(4,6);
  var rnDay = rn.substring(6,8);
  var rnHour = rn.substring(8,10);
  var rnMinute = rn.substring(10,12);
  var rnSecond = rn.substring(12,14);

// var savedTime = rnYear + '-' + rnMonth + '-' + rnDay + 'T' + rnHour + ':' + rnMinute + ':' + rnSecond + 'Z';
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
  setTimeout(refresh, 10000); // 10 secs
};

var tokenReceived = function(res, error, token) {
      if (error) {
        console.log("Access token error: ", error.message);
      }
      else {
        savedToken = token.token.access_token;
        savedEmail = authHelper.getEmailFromIdToken(token.token.id_token);
        refreshToken = token.token.refresh_token;
        res.redirect(302, 'https://data.lohud.com/bots/trellobot/');
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


  d = new Date();
  
  var today = d.yyyymmdd().toString();
    var year = today.substring(0,4);
    var month = today.substring(4,6);
    var day = today.substring(6,8);
    var hour = today.substring(8,10);
    var minute = today.substring(10,12);
    var second = today.substring(12,14);

  // var date = year + '-' + month + '-' + day + 'T' + hour + ':' + minute + ':' + second + 'Z';

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
  }
  // setTimeout(checkMail, 100000); // 10 secs
  setTimeout(checkMail, 10000); // 10 secs
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