function sleep(ms) {
    return new Promise(revolve =>setTimeout(revolve,ms))
}

const https = require('https');
var AWS = require('aws-sdk');
var spawn = require('child_process').spawn;

AWS.config.update({region: 'us-west-2'});
AWS.config.update({
  maxRetries: 15,
  retryDelayOptions: {base: 500}
});
//['indian','japanese','italian', 'mexican','chinese', 'thai'];
const validcuisine = ['thai']//,'japanese','italian', 'mexican','chinese', 'thai']; //'indpak', 'german','spanish','indian', 'burmese','mediterranean','persian','french','turkish','labanese','persian'];

async function test () {
    //var idcount=1;
for (var i=0; i<validcuisine.length;i++) {
    var cuisine = validcuisine[i];
    for (var j=0; j<20;j++) {
        var offset = 50*j;
        var ps = `/v3/businesses/search?term=${cuisine}&location=Manhattan&limit=50&offset=${offset}`;
        console.log(ps);

        var options = {
            hostname: "api.yelp.com",
            path: ps.replace(' ','%20'),
            headers:{
                Authorization: '<YELP API KEY>'
            }

        };

        //console.log('begin');
        var req = https.request(options, (res) => {

            var docClient = new AWS.DynamoDB.DocumentClient();
            //console.log(docClient);
            //console.log(`statusCode: ${res.statusCode}`);
            var chunks = [];
            res.on("data", function (chunk) {
                chunks.push(chunk);
            });

            res.on("end", function () {
                var body = Buffer.concat(chunks);
                var yelpResults = JSON.parse(body);
                
                var k = yelpResults.businesses;
                var ss = 1;
                var each = '';
                var ans = [];

                //console.log(yelpResults);


                k.forEach(business=> {

                    var date = new Date();
                    var timestamp = date.getTime();

                    var params = {
                        TableName: "yelp-restaurants",
                        Item: {
                            "BusinessID": business.id,
                            "Name": business.name,
                            "Address": business.location.address1,
                            "CoordinatesLatitude": business.coordinates.latitude,
                            "CoordinatesLongitude": business.coordinates.longitude,
                            "NumberOfReviews": business.review_count,
                            "Rating": business.rating,
                            "ZipCode": business.location.zip_code,
                            "InsertedAtTimestamp": timestamp,
                            "Cuisine": cuisine

                        }
                    };

                    docClient.put(params, function(err, data) {
                        if (err) {
                            console.log(params);
                            console.error("Unable to add item", 12, ". Error JSON:", JSON.stringify(err, null, 2));
                        } else {
                            console.log("PutItem succeeded");
                    
                        }
                    });

                    

                    ss=ss+1;

                });

            });
        });

        req.end();
        await sleep(1000);


    }
    

}
}
test()


















