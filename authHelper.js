var credentials = require('./credentials')
var oauth2 = require('simple-oauth2')(credentials.oauthcred);
var redirectUri = "https://data.lohud.com/bots/trellobot/authorize";
// var redirectUri = "http://localhost:8080/authorize";


//  The Scopes the app requires
var scopes = [ "openid",
               "https://outlook.office.com/mail.read",
               "profile",
               "offline_access" ];

module.exports = {
    getAuthUrl: function() {
        var returnVal = oauth2.authCode.authorizeURL({
            redirect_uri: redirectUri,
            scope: scopes.join(" ")
        });
        // console.log("Generated auth url: " + returnVal);
        return returnVal;
    },

    getTokenFromCode: function(auth_code, callback, res) {
        var token;
        // console.log(auth_code);
        oauth2.authCode.getToken({
            code: auth_code,
            redirect_uri: redirectUri,
            scope: scopes.join(" ")
            }, function (error, result) {
              if (error) {
                console.log("Access token error: ", error.message);
                callback(res, error, null);
              } else {
                token = oauth2.accessToken.create(result);
                callback(res, null, token);
              }
        });
    },

    getEmailFromIdToken: function(id_token) {
        // JWT is in three parts, separated by a '.'
        var token_parts = id_token.split('.');

        // Token content is in the second part, in urlsafe base64
        var encoded_token = new Buffer(token_parts[1].replace("-", "+").replace("_", "/"), 'base64');

        var decoded_token = encoded_token.toString();

        var jwt = JSON.parse(decoded_token);
        // Email is in the preferred_username field
        return jwt.preferred_username
    },
}
