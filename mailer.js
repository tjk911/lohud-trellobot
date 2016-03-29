var outlook = require('node-outlook')
  , authHelper = require('./authHelper')
  , Slack = require('node-slack')
  , credentials = require('./credentials')

var slack = new Slack(credentials.webhookUri);

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
  var token = getValueFromCookie('node-tutorial-token', req.headers.cookie);
  console.log("Token found in cookie: ", token);
  var email = getValueFromCookie('node-tutorial-email', req.headers.cookie);
  console.log("Email found in cookie: ", email);
  if (token) {
    var queryParams = {
      '$select': 'Subject,ReceivedDateTime,From',
      '$orderby': 'ReceivedDateTime desc',
      '$top': 10
    };
    
    // Set the API endpoint to use the v2.0 endpoint
    outlook.base.setApiEndpoint('https://outlook.office.com/api/v2.0');
    // Set the anchor mailbox to the user's SMTP address
    outlook.base.setAnchorMailbox(email);
    
    outlook.mail.getMessages({token: token, odataParams: queryParams},
      function(error, result){
        if (error) {
          console.log('getMessages returned an error: ' + error);
          // res.write("<p>ERROR: " + error + "</p>");
          // res.end();
          res.render('mail', {
            title : 'Trellobot | lohud.com',
            status: 'alert',
            message: error
          });
        }
        else if (result) {
          console.log('getMessages returned ' + result.value.length + ' messages.');
          res.render('mail', {
            title : 'Trellobot | lohud.com',
            status: 'success',
            message: 'Great success!',
            JSON: result.value
          });
          console.log(result.value);
          var message = { text: 'text = holla',
                          username: 'Hypnotoad',
                          icon_emoji: ':hypnotoad:',
                          channel: '#trellotest' };
          slack.send(message);
        }
      });
  }
  else {
    res.render('mail', {
      title : 'Trellobot | lohud.com',
      status: 'alert',
      message: 'No token found in cookie!'
    });
  }
};

module.exports = {
  tokenReceived: tokenReceived,
  getValueFromCookie: getValueFromCookie,
  checkMail: checkMail
}

