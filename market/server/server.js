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

// var PROTO_PATH = __dirname + 'test.txt';
var PROTO_PATH = '../market.proto';


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

// const grpcObject = grpc.loadPackageDefinition(packageDefinition);
// const protoPackage = grpcObject.packageName; // Get the package name from proto file

var userFileMap = new Map();


/**
 * Implements the SayHello RPC method.
 */
function argvIssue() {
  console.log('\nPlease provide enough information');

}

function addFile(call, callback) {
  let hash = call.request.hash;
  let price = call.request.price;
  let ip = call.request.ip;
  let port = call.request.port;
  let newItem = new File(hash, ip, port, price);
  Market.push(newItem);
  // console.log(newItem);
  printMarket();
  callback(null, { message: "File " + hash + " from " + ip + ":" + port + " with price: $" + price + " per MB added successfully" });
}

function printMarket() {
  console.log("\n")
  // Market.forEach(file => {
  //   console.log(file);
  // })
  // console.log("\n");
  // console.log("\n");
  userFileMap.forEach(function (value, key) {
    console.log(key + ": { id: " + value.id
      + ", name: " + value.name
      + ", ip: " + value.ip
      + " port: " + value.port
      + " price: " + value.price + " }");
  })
}

function registerFile(call, callback) {

  let newUser = call.request.user;
  let fileHash = call.request.fileHash;

  // console.log(call);
  // console.log(call.request);
  // console.log("Hashed File: " + fileHash);
  // console.log("Username:" + newUser.name);
  // console.log("IP Address:" + newUser.ip);
  // console.log("Port:" + newUser.port);
  // console.log("Price:" + newUser.price);

  userFileMap.set(fileHash, newUser);
  // Market.push(new UserHash(newUser, fileHash));

  printMarket();
  callback(null, {
    message: "File " + fileHash + " from " + newUser.name + "'s "
      + newUser.ip + ":" + newUser.port + " with price: $"
      + newUser.price + " per MB added successfully"
  }); // ?
  // console.log("test");
}

function checkHolders(call, callback) {
  console.log("test");
}

/**
 * Starts an RPC server that receives requests for the Greeter service at the
 * sample server port
 */
function main() {
  const server = new grpc.Server();
  server.addService(market_proto.Market.service, { RegisterFile: registerFile, CheckHolders: checkHolders });
  // server.addService(market_proto.Market.service, { CheckHolders: checkHolders });
  // server.addService(market_proto.FileSender.service, { addFile: addFile });
  server.bindAsync('0.0.0.0:50051', grpc.ServerCredentials.createInsecure(), () => {
    server.start();
  });

  // Market.push();

}

function UserHash(user, fileHash) {
  this.user = user;
  this.fileHash = fileHash;
}

function File(hash, ip, port, price) {
  this.hash = hash;
  this.ip = ip;
  this.port = port;
  this.price = price;
}

main();
