exports.handler = async (event) => {

    console.log('Loading function');
    var AWS = require('aws-sdk');
    AWS.config.update({region: 'us-west-2'});
    var lexruntime = new AWS.LexRuntime();

    var lexChatbotParams = {
        botAlias: 'BETA',
        botName: 'RestaurantRecommend',
        inputText: JSON.parse(event.body).lastUserMessage,
        userId: JSON.parse(event.body).refId,
        requestAttributes: {},
        sessionAttributes: {}
    };

    return lexruntime.postText(lexChatbotParams).promise()
    .then((data) =>{
        const response = {
            headers: {
                "Access-Control-Allow-Origin" : "*"
            },
            statusCode: 200,
            body: data.message
        };
        return response;
    })
    .catch((err) =>{
        console.log(err);
    })
};