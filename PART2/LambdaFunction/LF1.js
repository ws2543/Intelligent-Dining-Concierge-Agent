function elictSlot(sessionAttributes, intentName, slots, slotToElicit, message) {

    return {
        sessionAttributes,
        dialogAction: {
            type: 'ElicitSlot',
            intentName,
            slots,
            slotToElicit,
            message
        }
    };
}

function buildValidationResult(isValid, violatedSlot, messageContent) {

    return {
        isValid,
        violatedSlot,
        message: {
            contentType: 'PlainText',
            content: messageContent
        }
    };
}

function close(sessionAttributes, fulfillmentState, message) {

    return {
        sessionAttributes,
        dialogAction: {
            type: 'Close',
            fulfillmentState,
            message
        }
    };
}

function isValidCity(city) {

    const validCities = ['manhattan','new york', 'los angeles', 'chicago', 'houston', 'philadelphia', 'phoenix', 'san antonio', 'san diego', 'dallas', 'san jose','austin', 'jacksonville', 'san francisco', 'indianapolis', 'columbus', 'fort worth', 'charlotte', 'detroit', 'el paso', 'seattle', 'denver', 'washington dc','memphis', 'boston', 'nashville', 'baltimore', 'portland'];

    return (validCities.indexOf(city.toLowerCase()) > -1);
}

function isValidCuisine(cuisine) {

    const validCuisine = ['japanese','chinese','italian', 'mexican', 'thai','indian'];

    return (validCuisine.indexOf(cuisine.toLowerCase()) > -1);

}


function validate1(slots) {
    const city = slots.Location;

    if(!isValidCity(city)) {
        return buildValidationResult(false, 'Location',`We currently do not support ${city} as a valid destination.  Can you try a different city?`);
    }

    return { isValid: true };
}

function validate2(slots) {
    const cuisine = slots.Cuisine;

    if(!isValidCuisine(cuisine)) {
        return buildValidationResult(false, 'Cuisine',`We do not have ${cuisine} cuisine, would you like to try something different? I highly recommend Chinese cuisine!`);
    }

    return { isValid: true };
}


// ----------- Events -------------

function PushMessage(intentRequest, callback) {

    const sessionAttributes = intentRequest.sessionAttributes;
    const slots = intentRequest.currentIntent.slots;
    var city = slots.Location;
    var cuisine = slots.Cuisine;
    var people = slots.NumberOfPeople;

    var eat_date = slots.DiningDate;
    var eat_time = slots.DiningTime;
    var unix_time = new Date(eat_date + 'T' + eat_time + 'Z').getTime() / 1000;

    var email = slots.EmailAddress; //Attention!!!

    const validationResult1 = validate1(intentRequest.currentIntent.slots);
    const validationResult2 = validate2(intentRequest.currentIntent.slots);

    console.log(validationResult1);
    console.log(validationResult2);

    if (!validationResult1.isValid) {
        slots[`${validationResult1.violatedSlot}`] = null;
        callback(elictSlot(sessionAttributes, intentRequest.currentIntent.name,
            slots, validationResult1.violatedSlot, validationResult1.message));
        return;
    }

    if (!validationResult2.isValid) {
        slots[`${validationResult2.violatedSlot}`] = null;
        callback(elictSlot(sessionAttributes, intentRequest.currentIntent.name,
            slots, validationResult2.violatedSlot, validationResult2.message));
        return;
    }

    var AWS = require('aws-sdk');

    AWS.config.update({region: 'us-west-2'});

    var sqs = new AWS.SQS({apiVersion: '2012-11-05'});

    var params = {
        DelaySeconds: 10,
        MessageAttributes: {
            "Location": {
                DataType: "String",
                StringValue: city
            },

            "Cuisine": {
                DataType: "String",
                StringValue: cuisine
            },

            "DiningDate": {
                DataType: "String",
                StringValue: eat_date
            },

            "DiningTime": {
                DataType: "String",
                StringValue: eat_time
            },

            "NumberOfPeople": {
                DataType: "Number",
                StringValue: people
            },

            "EmailAddress": {
                DataType: "String",
                StringValue: email
            }
        },

        MessageBody: "Information user entered from Lex.",
        QueueUrl: "<QUEUE-URL>"
    };

    sqs.sendMessage(params, function(err, data) {

        console.log("add it");
        if (err) {
            console.log("Error", err);
        } else {
            console.log("Success!", data.MessageId);
        }
    });


    callback(close(sessionAttributes, 'Fulfilled',
        {'contentType': 'PlainText', 'content': "You’re all set. Expect my suggestions shortly! Have a good day."}));

    
};

function dispatch(intentRequest, callback) {
   return PushMessage(intentRequest, callback);
}


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














