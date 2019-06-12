const fs = require('fs')
const parse = require('csv-parse/lib/sync')
const AWS = require('aws-sdk')

AWS.config.update({region: 'us-west-2'});
const docClient = new AWS.DynamoDB.DocumentClient()

const contents = fs.readFileSync('./yelp-restaurants.csv', 'utf-8')
// If you made an export of a DynamoDB table you need to remove (S) etc from header
const data = parse(contents, {columns: true})

//data.forEach((item) => {
//        if(!item.maybeempty) delete item.maybeempty //need to remove empty items
//        docClient.put({TableName: '<Table>', Item: item}, (err, res) => {
//                if(err) console.log(err)
//        })      
//})

console.log(data)