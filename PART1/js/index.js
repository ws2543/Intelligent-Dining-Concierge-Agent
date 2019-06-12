function ID() {
 return '_' + Math.random().toString(36).substr(2, 9);
};

var UniqueId = ID();
var messages = [], 
  lastUserMessage = "", 
  botMessage = "", 
  botName = 'ChatBot';


var url = window.location.href;
var k = url.match(/id_token=(.*)&access/);
var id_token = k[1];


var params = {
  IdentityPoolId: "<IDENTITYPOOL-ID>", //us-west-2:XXXXXXX
  Logins: {
          '<LOGINS>': id_token //cognito-idp.us-west-2.amazonaws.com/us-west-2_XXXX
        }
};




function chatbotResponse() {

AWS.config.region = 'us-west-2';
var newcog = new AWS.CognitoIdentity()
newcog.getId(params, function(err, data){

  if (err) {console.log(err)}
  else {
    var iden_id = data['IdentityId']
  }
  console.log(iden_id)

  var new_params = {

    IdentityId: iden_id,
    Logins: {
      '<LOGINS>': id_token
    }
  };

  newcog.getCredentialsForIdentity(new_params, function(err, data){

    if (err) {console.log(err)}
    else {
      var thiscredential = data['Credentials'];
      console.log(thiscredential)
      console.log(thiscredential.AccessKeyId)
      console.log(thiscredential.SecretKey)
      console.log(thiscredential.SessionToken)
    var apigClient = apigClientFactory.newClient({

      accessKey: thiscredential.AccessKeyId,
      secretKey: thiscredential.SecretKey,
      sessionToken: thiscredential.SessionToken,
      region: 'us-west-2'
    });

    var params = {"Access-Control-Allow-Origin": '*'};

    botMessage = ""; 
    var body = {
    "lastUserMessage": lastUserMessage,
    "refId" :UniqueId
    };

    apigClient.chatbotPost(params, body, {})
      .then(function(result){
          botMessage = result.data;

          console.log(botMessage);

          messages.push("<b>" + botName + ":</b> " + botMessage);
          for (var i = 1; i < 14; i++) {
              if (messages[messages.length - i])
                  document.getElementById("chatlog" + i).innerHTML = messages[messages.length - i];
          }
      }).catch( function(result){
          console.log("Inside Catch function");
      });

      return botMessage;
    
}
  });
});

}


function newEntry() {
  if (document.getElementById("chatbox").value != "") {
    lastUserMessage = document.getElementById("chatbox").value;
    console.log(lastUserMessage)
    document.getElementById("chatbox").value = "";
    messages.push("<b>"+ "You"+ ":</b> "+ lastUserMessage);
    botMessage = chatbotResponse();
    
    }
}


document.onkeypress = keyPress;
function keyPress(e) {
  var x = e || window.event;
  var key = (x.keyCode || x.which);
  if (key == 13){
    newEntry();
  }

}

function placeHolder() {
  document.getElementById("chatbox").placeholder = "";
}