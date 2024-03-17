/*
 *
 * Copyright 2015 gRPC authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

var PROTO_PATH = '../market.proto';
var kad = require('kad');
var MemStore = require('kad-memstore');

var grpc = require('@grpc/grpc-js');
var protoLoader = require('@grpc/proto-loader');
var packageDefinition = protoLoader.loadSync(
  PROTO_PATH,
  {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
  });
var market_proto = grpc.loadPackageDefinition(packageDefinition).market;


// Map that stores User and hash
var userFileMap = new Map();

var seed = {
  address: '127.0.0.1',
  port: 1338
};

var node = new kad.Node({
  // transport: kad.HTTPTransport(),
  transport: kad.transports.TCP(
    kad.contacts.AddressPortContact({
      address: '127.0.0.1',
      port: 1337
    })
  ),
  storage: MemStore()
});


// Function that prints the HashMap
function printMarket() {
console.log("---------------inside printMarket-------------------");  

  userFileMap.forEach(function (value, key) {
    console.log(key + ": { id: " + value[0].id
      + ", name: " + value[0].name
      + ", ip: " + value[0].ip
      + " port: " + value[0].port
      + " price: " + value[0].price + " }");
  })
}

function printHolders(hold) {
  console.log("---------------inside printHolders--------------------");
  console.log(hold);
}

// put values in the kad node
function putMultiValues(node, multiValues, value) {
  multiValues.push(value);
  node.put(key, multiValues);
}

// get values in the kad node
function getValues(callback) {
  node.get(key, (err, storedValues) => {
    if (err) {
      callback(err);
    } else {
      callback(null, storedValues || []);
    }
  });
}

// Function to put a new value for a key, updating existing values if any
function putOrUpdateKeyValue(node, key, value) {
  node.has(key, (err, exists) => {
    if (err) {
      console.error('Error checking key existence:', err);
    } 
    else {
      if (exists) {
        // Key exists, get its current value
        node.get(key, (err, existingValue) => {
          if (err) {
            console.error('Error retrieving existing value:', err);
          } 
          else {
            // Update existing value with new value (might be needed to change to add with existing value)
            const updatedValue = Array.isArray(existingValue) ? [...existingValue, value] : [existingValue, value];
            // Put the updated value back into the node
            node.put(key, updatedValue, (err) => {
              if (err) {
                console.error('Error updating value:', err);
              } 
              else {
                console.log('Value updated successfully for key', key);
              }
            });
          }
        });
      } 
      else {
        // first time key
        node.put(key, value, (err) => {
          if (err) {
            console.error('Error adding new key-value pair:', err);
          } else {
            console.log('New key-value pair added successfully:', { key, value });
          }
        });
      }
    }
  });
}

// This function registers a file and user into the servers HashMap 
function registerFile(call, callback) {

  let newUser = call.request.user;
  let fileHash = call.request.fileHash;
  console.log("------------------register file---------------------");



  let multi = [];
  multi.push(newUser);

  // putOrUpdateKeyValue(node, fileHash, multi)

  node.connect(seed, function(err) {
    node.put(fileHash, newUser, callback);
  })
  

  // first time to try using kad node
  node.has(fileHash, (err, exists) => {
    if (err) {
      console.error('Error checking key existence:', err);
    } 
    else {
      if (exists) {
        console.log('Key', fileHash, 'exists in the node.');
        let newMap = multi.concat(userFileMap.get(fileHash));
    
        userFileMap.set(fileHash, newMap);
      } 
      else {
        console.log('Key', fileHash, 'does not exist in the node.');
      }
    }
  });
  
  // old way to add data
  if (userFileMap.has(fileHash)) {
    console.log("File already exist");
    
    let newMap = multi.concat(userFileMap.get(fileHash));
    
    userFileMap.set(fileHash, newMap);
  }
  else {
    console.log("File doesn't exist");
    userFileMap.set(fileHash, multi);
  }

  printMarket();
  callback(null, {
    message: "File " + fileHash + " from " + newUser.name + "'s "
      + newUser.ip + ":" + newUser.port + " with price: $"
      + newUser.price + " per MB added successfully"
  }); // ?

}


// CheckHolders should take a fileHash and looks it up in the hashmap and returns the list of users
function checkHolders(call, callback) {
  console.log("------------------check holders----------------------");
  // const fileHash = call.request.fileHash;
  // const user = userFileMap.get(fileHash);
  
  const holders = [];

  // user.forEach(x => {
  //   holders.push(x);
  // })

  console.log("Users Found");
  printHolders(holders);
  callback(null, {holders: holders});
}

function main() {
  const server = new grpc.Server();
  server.addService(market_proto.Market.service, { RegisterFile: registerFile, CheckHolders: checkHolders });
  server.bindAsync('0.0.0.0:50051', grpc.ServerCredentials.createInsecure(), () => {
    server.start();
  });

}


main();
