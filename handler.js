'use strict';

const uuidv1 = require('uuid/v1');
const AWS = require('aws-sdk');
const https = require('https');
const fs = require('fs');

const sslAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 50,
  rejectUnauthorized: true
});
sslAgent.setMaxListeners(0);

AWS.config.update({
  httpOptions:{
    agent: sslAgent
  }
});

let docClient;

module.exports.handler = async (event, context) => {
  initAwsClient();

  /*let resp = await docClient.get({
    TableName: 'roll-64',
    Key:{
        'uuid': 'test'
    }
  }).promise();

  console.log(resp);*/

  let response = 'res';

  switch(event.httpMethod) {
    case 'GET':
      response = await get(event.headers.Resourceid);
      break;
    case 'POST':
      response = await create(event.body);
      break;
    case 'PATCH':
      response = await update(event.headers.resourceId, event.body);
      break;
  }

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify({
      body: response,
      resId: event.headers.Resourceid,
      input: event
    }),
  };
};


async function roll64Logic(event){
  let method = event.httpMethod;
  let response;

  switch(event.httpMethod) {
    case 'GET':
      response+=event.headers.resourceId;
      response = await get(event.headers.resourceId);
      response = 'getTest';
      break;
    case 'POST':
      response = await create(event.body);
      break;
    case 'PATCH':
      response = await update(event.headers.resourceId, event.body);
      break;
  }

  return response;
}


async function test() {
  let playerState = {
    uuid: '123',
    avatar: '',
    charName: '',
    player: '',
    level: 3,
    food: 7,
    water: 0,
    xp: 800
  };

  //await update('test', playerState);
  //let u = await create(playerState);
}

function get(uuid) {
  const params = {
    TableName: 'roll-64',
    Key:{
        'uuid': uuid
    }
  };

  return new Promise(function(resolve, reject) {
    docClient.get(params, function(err, data) {
        if (err) {
          reject(err);
            console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
        } else {
          resolve(data);
        }
    });
  })
}

function update(uuid, playerState) {
  playerState.uuid = uuidv1();
  const params = {
    TableName: 'roll-64',
    Key:{
        'uuid': uuid
    },
    UpdateExpression: "set json = :j",
    ExpressionAttributeValues:{
        ":j": JSON.stringify(playerState)
    },
    ReturnValues:"UPDATED_NEW"
  };

  return new Promise(function(resolve, reject) {
    docClient.update(params, function(err, data) {
        if (err) {
          reject(err);
            console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
        } else {
          console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
          resolve(data);
        }
    });
  })
}

function create(rawPlayerState) {
  let playerState = JSON.parse(rawPlayerState);
  playerState.uuid = uuidv1();
  const params = {
    TableName: 'roll-64',
    Key:{
        'uuid': uuidv1()
    },
    UpdateExpression: "set json = :j",
    ExpressionAttributeValues:{
        ":j": JSON.stringify(playerState)
    },
    ReturnValues:"UPDATED_NEW"
  };

  return new Promise(function(resolve, reject) {
    docClient.update(params, function(err, data) {
        if (err) {
          reject(err);
            console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
        } else {
          console.log("CreateItem succeeded");
          resolve(playerState.uuid);
        }
    });
  })
}

function initAwsClient() {
  let config = JSON.parse(fs.readFileSync('credentials.json'));
  AWS.config = new AWS.Config(config);
  docClient = new AWS.DynamoDB.DocumentClient();
}