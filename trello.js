var Trello = require('node-trello')
  , credentials = require('./credentials')
  , t = new Trello(credentials.t1, credentials.t2)

var currentLength = 0;
var currentAssets = [];

// URL arguments are passed in as an object.

// Story asset routing board id: 559ea83005b8ca18ee32c19f
// Embargoed list id: 55b13a806c042819824c029f
// Done list id: 56af9e1a8f6e960993eb24ac
// Posted, needs finessing: 559ea8807d35a7f8ec25edc4

var grab = function(){
  t.get(
    "/1/lists/559ea8976fe031f2e5147baa/cards", { 
      // filter: "open", 
      // limit: "1" 
    }, 
    function(err, data){
      // if (err) throw err;
      if (err){
        console.log(err);
      }
      // Check to see if there are changes
      if (currentLength == data.length){
        // console.log("Don't do anything");
      } else {
        
        // Update the base length
        currentLength = data.length;
        var newAssets = [];

        // Loop through the list
        for (var i = 0; i < data.length; i++){
          // Check if list is push-worthy
          if (i > 0){
            newAssets.push(data[i]['name']);

            // Check if it exists in assets
            if (currentAssets.indexOf(data[i]['name']) > -1){
              // console.log('found it')
            } else {
              // console.log('does not exist, so we are pushing and announcing')
              currentAssets.push(data[i]['name']);
              credentials.slack.send({
                  text: "`"+data[i]['name']+'` is ready',
                  channel: '#audience',
                  // channel: '#trellotest',
                  username: 'Zoidberg',
                  icon_emoji: ':Zoidberg:',
              });
            }
          }
        }
        // End loop through the list

        // Loop through the asset
        for (var x = 0; x < currentAssets.length; x++){
          var assetpos = newAssets.indexOf(currentAssets[x]);

          // check if assets exist in data
          if (newAssets.indexOf(currentAssets[x]) > -1){
            // console.log(currentAssets[x]+' is still here')
          } else {
            // console.log(currentAssets[x]+' is now gone')
            credentials.slack.send({
                text: "`"+currentAssets[x]+'` has been moved out of ready',
                channel: '#audience',
                // channel: '#trellotest',
                username: 'Zoidberg',
                icon_emoji: ':Zoidberg:',
            }, function(err, response){
              console.log(err);
              currentAssets = newAssets;
            });
          }
        }
        // end loop through the asset
      }
      
    }
  );
  // set refresh frequency
  setTimeout(grab, 5000);
};

var move = function (assetId, destination, channel){

  console.log('Trello.js has received the move command');

  t.get("/1/lists/559ea8976fe031f2e5147baa/cards", { // loop through ready

  }, function (err, data){
    if (err){
      console.log(err);
    } else {
      console.log('first block');
      for (var i = 0; i < data.length; i++){
        var cardName = data[i]['name'].split(" ");
        var cardId = cardName[0];

        if (assetId == cardId){
          console.log(data[i]['id']);
          console.log('this is the assetId: ' + cardId);

          if (destination == 'done' || destination == 'Done'){
            t.put("/1/cards/"+data[i]['id'],{
              idList: '56af9e1a8f6e960993eb24ac'
            }, function (err){
              if (err){
                console.log(err);
              }
            })
          } else if (destination == 'embargoed' || destination == 'Embargoed' || destination == 'Embargo' || destination == 'embargo'){
            t.put("/1/cards/"+data[i]['id'],{
              idList: '55b13a806c042819824c029f'
            }, function (err){
              if (err){
                console.log(err);
              }
            })
          }
        }
      }
    }
  });

  t.get("/1/lists/56af9e1a8f6e960993eb24ac/cards", { // loop through done

  }, function (err, data){
    if (err){
      console.log(err);
    } else {
      console.log('second block');
      for (var i = 0; i < data.length; i++){
        var cardName = data[i]['name'].split(" ");
        var cardId = cardName[0];

        if (assetId == cardId){
          console.log(data[i]['id']);
          console.log('this is the assetId: ' + cardId);

          if (destination == 'ready' || destination == 'Ready'){
            t.put("/1/cards/"+data[i]['id'],{
              idList: '559ea8976fe031f2e5147baa'
            }, function (err){
              if (err){
                console.log(err);
              }
            })
          } else if (destination == 'embargoed' || destination == 'Embargoed' || destination == 'Embargo' || destination == 'embargo'){
            t.put("/1/cards/"+data[i]['id'],{
              idList: '55b13a806c042819824c029f'
            }, function (err){
              if (err){
                console.log(err);
              }
            })
          }
        }
      }
    }
  });

  t.get("/1/lists/55b13a806c042819824c029f/cards", { // loop through embargoed

  }, function (err, data){
    if (err){
      console.log(err);
    } else {
      console.log('third block');
      for (var i = 0; i < data.length; i++){
        var cardName = data[i]['name'].split(" ");
        var cardId = cardName[0];

        if (assetId == cardId){
          console.log(data[i]['id']);
          console.log('this is the assetId: ' + cardId);

          if (destination == 'done' || destination == 'Done'){
            t.put("/1/cards/"+data[i]['id'],{
              idList: '56af9e1a8f6e960993eb24ac'
            }, function (err){
              if (err){
                console.log(err);
              }
            })
          } else if (destination == 'ready' || destination == 'Ready'){
            t.put("/1/cards/"+data[i]['id'],{
              idList: '559ea8976fe031f2e5147baa'
            }, function (err){
              if (err){
                console.log(err);
              }
            })
          }
        } 
      }
    }
  });
  

  console.log('Trello.js has fired off the move command');
    
};


var list = function (listname, channel){
  console.log('Trello.js has received the list command');
  // console.log(currentAssets);
  console.log(listname);
  console.log(channel);
  if (listname == 'ready'){
    t.get(
      "/1/lists/559ea8976fe031f2e5147baa/cards", { 
        // filter: "open", 
        // limit: "1" 
      }, 
      function(err, data){
        // if (err) throw err;
        if (err){
          console.log(err);
        }
        if (data.length == 1){
          credentials.slack.send({
              text: 'There is nothing in this list',
              channel: channel,
              username: 'Calculon',
              icon_emoji: ':Calculon:',
          });
        } else {
        // Loop through the list
          for (var i = 0; i < data.length; i++){
            // Check if list is push-worthy
            if (i > 0){
              credentials.slack.send({
                  text: "`"+data[i]['name']+'` is ready',
                  channel: channel,
                  username: 'Calculon',
                  icon_emoji: ':Calculon:',
              });          
            } 
          }          
        }
        // End loop through the list
      }
    );
  } else if (listname == 'embargoed'){
    t.get(
      "/1/lists/55b13a806c042819824c029f/cards", { 
        // filter: "open", 
        // limit: "1" 
      }, 
      function(err, data){
        // if (err) throw err;
        if (err){
          console.log(err);
        }
        // Loop through the list

        if (data.length == 0){
          credentials.slack.send({
              text: 'There is nothing in this list',
              channel: channel,
              username: 'Calculon',
              icon_emoji: ':Calculon:',
          });
        } else {
          for (var i = 0; i < data.length; i++){
            // Check if list is push-worthy
            credentials.slack.send({
                text: "`"+data[i]['name']+'` has been embargoed',
                channel: channel,
                username: 'Calculon',
                icon_emoji: ':Calculon:',
            });        
          }
        }
        // End loop through the list
      }
    );
  } else if (listname == 'done'){
    t.get(
      "/1/lists/56af9e1a8f6e960993eb24ac/cards", { 
        // filter: "open", 
        // limit: "1" 
      }, 
      function(err, data){
        // if (err) throw err;
        if (err){
          console.log(err);
        }
        // Loop through the list

        if (data.length == 0){
          credentials.slack.send({
              text: 'There is nothing in this list',
              channel: channel,
              username: 'Calculon',
              icon_emoji: ':Calculon:',
          });
        } else {
          for (var i = 0; i < data.length; i++){
            // Check if list is push-worthy
            credentials.slack.send({
                text: "`"+data[i]['name']+'` has been published',
                channel: channel,
                username: 'Calculon',
                icon_emoji: ':Calculon:',
            });
          }
        }
        // End loop through the list
      }
    );
  } else if (listname == undefined) {
    credentials.slack.send({
        text: "Sorry, you need to specify which list. Use `trellobot help list` to learn how to use this command.",
        channel: channel,
        username: 'Prof. Farnsworth',
        icon_emoji: ':farnsworth:',
    });
  }

  console.log('Trello.js has fired off the list to Slack');
  // return listAssets;
  res.end();
};


module.exports ={
  grab: grab,
  move: move,
  list: list
}