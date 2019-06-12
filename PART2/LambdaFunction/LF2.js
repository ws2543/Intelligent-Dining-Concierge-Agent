exports.handler = (event, context, callback) => {
	function createRandom2(num , from , to)
	{
    	var arr=[];
    	var json={};
    	while(arr.length<num)
    	{

        	var ranNum=Math.ceil(Math.random()*(to-from))+from;

        	if(!json[ranNum])
        	{
            	json[ranNum]=1;
            	arr.push(ranNum);
        	}
         
    	}
    	return arr;    
	}



	var AWS = require('aws-sdk');
	AWS.config.update({region: 'us-west-2'});

	var sqs = new AWS.SQS({apiVersion: '2012-11-05'});
	var params = {
		QueueUrl: "<QUEUE-URL>",
		AttributeNames: [
			"SentTimestamp"
		],
		MaxNumberOfMessages: 10,
		MessageAttributeNames: [
			"All"
		],
		VisibilityTimeout: 60,
  		WaitTimeSeconds: 0
	};

	sqs.receiveMessage(params, function(err, data) {
		if (err) {
			console.log(err);
		} 
		else if (data.Messages) {
			data.Messages.forEach(Message => {
				var deleteparams = {
					QueueUrl: "<QUEUE-URL>",
					ReceiptHandle: Message.ReceiptHandle
				};
				console.log(Message);

				var MessageId = Message.MessageId;
				var Location = Message.MessageAttributes.Location.StringValue;
				var Cuisine = Message.MessageAttributes.Cuisine.StringValue;
            	var DiningDate = Message.MessageAttributes.DiningDate.StringValue;
            	var DiningTime = Message.MessageAttributes.DiningTime.StringValue;
            	var NumberOfPeople = Message.MessageAttributes.NumberOfPeople.StringValue;
            	var EmailAddress = Message.MessageAttributes.EmailAddress.StringValue;
            	
            	var region = 'us-west-2'; // e.g. us-west-1
				var domain = '<YOUR-ELASTIC-DOMAIN>'; // e.g. search-domain.region.es.amazonaws.com
				var index = '<YOUR-INDEX>';
				var type = '<YOUR-TYPE>';
				var search = `_search?q=${Cuisine}&size=2000`;

				var endpoint = new AWS.Endpoint(domain);
				var request = new AWS.HttpRequest(endpoint, region);

				request.method = 'GET';
				request.path += index + '/' + type + '/' + search;
				request.headers['host'] = domain;
				request.headers['Content-Type'] = 'application/json';

				var client = new AWS.HttpClient();


            	client.handleRequest(request, null, function (response) {
					//console.log(response.statusCode + ' ' + response.statusMessage);
    				var responseBody = '';
    				response.on('data', function (chunk) {
      					responseBody += chunk;
    				});

					response.on("end", function (chunk) {
						//console.log('Response body: ' + responseBody);
						var restaurants = JSON.parse(responseBody).hits.hits;

						var restaurantID = '';
						var ans_all = [];
						var ans = [];
						ans.push(`Hello! Here are my ${Cuisine} restaurant suggestions for ${NumberOfPeople} people, for ${DiningDate} at ${DiningTime}: `);
						restaurants.forEach(restaurant=> {
							restaurantID = restaurant._source.RestaurantID;
							ans_all.push(restaurantID);

						});
		
						var randomNumbers = createRandom2(3,0,ans_all.length-1);
						console.log(ans_all.length);
						console.log(randomNumbers);

						var count = 1;
						randomNumbers.forEach(randomNumber=> {
		
							var businessid = ans_all[randomNumber];
							var docClient = new AWS.DynamoDB.DocumentClient();
							var params = {
								TableName : "yelp-restaurants",
								KeyConditionExpression: "#yr = :yyyy",
								ExpressionAttributeNames:{
        							"#yr": "BusinessID"
    							},
    							ExpressionAttributeValues: {
       								":yyyy": businessid
   								}
							};

							docClient.query(params, function(err, data) {
								if (err) {
									console.log("Unable to query:", JSON.stringify(err, null, 2));
								} else {
									//console.log("Query succeeded.");
									data.Items.forEach(function(item) {
										//console.log(count);
										var eachAnswer='';
										eachAnswer = count+". "+(item.Name)+", located at "+ item.Address + ", ";
										//console.log(eachAnswer)

										ans.push(eachAnswer);
										if (count==3) {
											ans.push("enjoy your meal!");
											var sms = ans.join('')
											console.log(sms);

											var params = {
												Message: sms, /* required */
												TopicArn: '<YOUR-TOPIC_ARN>'
											};

											var publishTextPromise = new AWS.SNS({apiVersion: '2010-03-31'}).publish(params).promise();

											publishTextPromise.then(
												function(data) {
													console.log("Message ${params.Message} send sent to the topic ${params.TopicArn}");
													console.log("MessageID is " + data.MessageId);
												}).catch(
												function(err) {
													console.log(err, err.stack);
												});
										}
										count = count+1;
										//console.log(ans);

									});
								}
							});
						});

						//ans.push("Enjoy your meal!")
						//console.log(ans.join(''));
					});
				}, function (error) {
					console.log('Error: ' + error);
				});

				sqs.deleteMessage(deleteparams, function(err, data) {
					if (err) {
						console.log("Delete Error", err);
					} else {
						console.log("Message Deleted", data);
					}
				});


            	
			});
		}
	});
}