var outlook = require('node-outlook')
  , authHelper = require('./authHelper')
  , Slack = require('node-slack')
  , credentials = require('./credentials')

var slack = new Slack(credentials.webhookUri);
var savedToken;
var savedEmail;

var currentMailLength = 0;
var currentMailAssets = [];

var tokenReceived = function(res, error, token) {
  if (error) {
    console.log("Access token error: ", error.message);
    res.set({
      'Set-Cookie': cookie
    });
    res.write('<p>ERROR: ' + error + '</p>');
    res.end();
  }
  else {
    var cookies = ['node-tutorial-token=' + token.token.access_token + ';Max-Age=3600',
                   'node-tutorial-email=' + authHelper.getEmailFromIdToken(token.token.id_token) + ';Max-Age=3600'];
    res.set({
      'Set-Cookie': cookies
    });
    // res.redirect(302, 'https://data.lohud.com/bots/trellobot/mail');
    // res.end();
    savedToken = token.token.access_token;
    savedEmail = authHelper.getEmailFromIdToken(token.token.id_token);
    res.redirect(302, 'https://data.lohud.com/bots/trellobot/mail');
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
  Date.prototype.yyyymmdd = function() {
    var yyyy = this.getFullYear().toString();
    var mm = (this.getMonth()+1).toString(); // getMonth() is zero-based
    var dd  = this.getDate().toString();
    return yyyy + (mm[1]?mm:"0"+mm[0]) + (dd[1]?dd:"0"+dd[0]); // padding
  };

  d = new Date();
  
  var today = d.yyyymmdd().toString();
    var year = today.substring(0,4);
    var month = today.substring(4,6);
    var day = today.substring(6,8);

  var date = year + '-' + month + '-' + day;
  console.log(date);

  // var token = getValueFromCookie('node-tutorial-token', req.headers.cookie);
  console.log("Token found in cookie: ", savedToken);
  // console.log("Token found in cookie orig: ", token);
  // var email = getValueFromCookie('node-tutorial-email', req.headers.cookie);
  console.log("Email found in cookie: ", savedEmail);
  // console.log("Email found in cookie orig: ", email);
  if (savedToken) {
    var queryParams = {
      '$filter':"ReceivedDateTime ge "+date+" AND From/EmailAddress/Address eq 'noreply.ap@notification.ap.org'",
      '$select': 'Subject,ReceivedDateTime,From',
      '$orderby': 'ReceivedDateTime desc',
      // '$top': 10
      // '$search': 'from:noreply.ap@notification.ap.org'
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

          // Check to see if we need to query the inbox
          if (currentMailLength == result.value.length) {
            console.log('nothing has changed in the inbox')
          } else {
            // Update the saved inbox value
            currentMailLength = result.value.length;
            var newMailAssets = [];

            // console.log('getMessages returned ' + result.value.length + ' messages.');
            var inbox = result['value'];

            // Query inbox for emails
            for (var i = 0; i < inbox.length; i++) {

              // Store the new email headlines
              newMailAssets.push(inbox[i]['Subject']);

              // Check if there are new headlines
              if (currentMailAssets.indexOf(inbox[i]['Subject']) > -1) {
                // Nope! Old emails!
              } else {

                // Store the new emails into the saved array 
                currentMailAssets.push(inbox[i]['Subject']);
                slack.send({
                    text: "`AP NOTIFICATION:` *"+inbox[i]['Subject']+'*',
                    channel: '#trellotest',
                    username: 'Associated Press',
                    icon_emoji: ':Deathstar:',
                });

              }
            }
          }          
        }
      });
  }
  else {
    console.log('mailer.js broke!')
  }
  setTimeout(checkMail, 100000); // 10 secs
  console.log('mail pinged')
};

module.exports = {
  tokenReceived: tokenReceived,
  getValueFromCookie: getValueFromCookie,
  checkMail: checkMail
}