
'use strict';
    function elicitSlot(sessionAttributes, intentName, slots, slotToElicit, message) {
    return {
        sessionAttributes,
        dialogAction: {
            type: 'ElicitSlot',
            intentName,
            slots,
            slotToElicit,
            message,
        },
    };
}
    
    function buildValidationResult(isValid, violatedSlot, messageContent) {
    return {
        isValid,
        violatedSlot,
        message: { contentType: 'PlainText', content: messageContent },
    };
}

    function close(sessionAttributes, fulfillmentState, message) {
        return {
            sessionAttributes,
            dialogAction: {
                type: 'Close',
                fulfillmentState,
                message,
            },
        };
    }
     

    function isValidCity(city) {
    const validCities = ['manhattan','new york', 'los angeles', 'chicago', 'houston', 'philadelphia', 'phoenix', 'san antonio', 'san diego', 'dallas', 'san jose',
    'austin', 'jacksonville', 'san francisco', 'indianapolis', 'columbus', 'fort worth', 'charlotte', 'detroit', 'el paso', 'seattle', 'denver', 'washington dc',
    'memphis', 'boston', 'nashville', 'baltimore', 'portland'];
    return (validCities.indexOf(city.toLowerCase()) > -1);
}

    
    function isValidCuisine(cuisine) {
    const validCuisine = ['japanese','chinese','italian', 'mexican','korean', 'thai', 'indpak', 'german','spanish','indian', 'burmese','mediterranean','persian','french','turkish','labanese','persian'];
    return (validCuisine.indexOf(cuisine.toLowerCase()) > -1);
}

    function validate1(slots) {
    const city = slots.Location;
    

    if (!isValidCity(city)) {
        return buildValidationResult(false, 'Location', `We currently do not support ${city} as a valid destination.  Can you try a different city?`);
    }
    return { isValid: true };
}

    function validate2(slots) {  
    const cuisine = slots.Cuisine;
    

    if (!isValidCuisine(cuisine)) {
        return buildValidationResult(false, 'Cuisine', `We do not have ${cuisine} cuisine, would you like to try something different? I highly recommend Chinese cuisine!`);
    }
    return { isValid: true };
}
    // --------------- Events -----------------------
     
    function yelpcall(intentRequest, callback) {
        const sessionAttributes = intentRequest.sessionAttributes;
        const slots = intentRequest.currentIntent.slots;
        var city = slots.Location;
        var cuisine = slots.Cuisine;
        var people = slots.NumberOfPeople;
        
        
        var eat_date = slots.DiningDate;
        var eat_time = slots.DiningTime;
        var unix_time = new Date(eat_date+'T' + eat_time + 'Z').getTime() / 1000;
       
        const validationResult1 = validate1(intentRequest.currentIntent.slots);
        const validationResult2 = validate2(intentRequest.currentIntent.slots);
        console.log(validationResult1);
        console.log(validationResult2);

        if (!validationResult1.isValid) {
            slots[`${validationResult1.violatedSlot}`] = null;
            callback(elicitSlot(sessionAttributes, intentRequest.currentIntent.name,
            slots, validationResult1.violatedSlot, validationResult1.message));
            return;
        }
        
        if (!validationResult2.isValid) {
            slots[`${validationResult2.violatedSlot}`] = null;
            callback(elicitSlot(sessionAttributes, intentRequest.currentIntent.name,
            slots, validationResult2.violatedSlot, validationResult2.message));
            return;
        }
        const https = require('https');
        
        var ps = `/v3/businesses/search?term=${cuisine}&location=${city}&open_at=${unix_time}&limit=3`;
        console.log(ps);
        var options = {        
        hostname: 'api.yelp.com',
        
        path: ps.replace(' ','%20'),
        method: 'GET',
        headers:{
            Authorization: '<YELP API KEY>'            
       }
        };
        
        console.log('begin');
        var req = https.request(options, (res) => {
            console.log(`statusCode: ${res.statusCode}`);
            var chunks = [];
                res.on("data", function (chunk){
            chunks.push(chunk);
          });
                res.on("end", function () {
            var body = Buffer.concat(chunks);
            var yelpResults = JSON.parse(body);
          
            var k =  yelpResults.businesses;
            var i = 1;
            var each = '';
            var ans = [];
            k.forEach(business=> {
              each=" "+ i+". "+(business.name)+", located at "+business.location.address1;
              ans.push(each);
              i=i+1;
            });
            console.log(ans);
            
            
             callback(close(sessionAttributes, 'Fulfilled',
        {'contentType': 'PlainText', 'content': `Here are my ${cuisine} restaurant suggestions for ${people} people, for ${eat_date} at ${eat_time} :${ans}, enjoy your meal!`}));
            
            
                });
            
            
        });
        
        req.on('error', (error) => {
            console.log('fail');
  console.error(error);
});

req.end();
    

        
    };
        
    function dispatch(intentRequest, callback) {

        return yelpcall(intentRequest, callback);
    
        }

   
    // --------------- Main handler -----------------------
     
    exports.handler = (event, context, callback) => {
        try {
            console.log('here');
            dispatch(event,
                (response) => {
                    callback(null, response);
                });
        } catch (err) {
            callback(err);
        }
    };
    
    
    

