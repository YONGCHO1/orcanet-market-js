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

var PROTO_PATH = __dirname + '/../protos/helloworld.proto';

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
var hello_proto = grpc.loadPackageDefinition(packageDefinition).helloworld;


var Market = [
  // new File("hash1", "ip1", "port1", "price1"),
  // new File("hash2", "ip2", "port2", "price2"),
  // new File("hash3", "ip3", "port3", "price3"),
];

/**
 * Implements the SayHello RPC method.
 */
function argvIssue() {
  // console.log('\nPlease provide enough information');

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
  Market.forEach(file => {
    console.log(file);
  })
}

/**
 * Starts an RPC server that receives requests for the Greeter service at the
 * sample server port
 */
function main() {
  var server = new grpc.Server();
  server.addService(hello_proto.ArgvChecker.service, { argvIssue: argvIssue });
  server.addService(hello_proto.FileSender.service, { addFile: addFile });
  server.bindAsync('0.0.0.0:50051', grpc.ServerCredentials.createInsecure(), () => {
    server.start();
  });



  // Market.push();

}

function File(hash, ip, port, price) {
  this.hash = hash;
  this.ip = ip;
  this.port = port;
  this.price = price;
}

main();
