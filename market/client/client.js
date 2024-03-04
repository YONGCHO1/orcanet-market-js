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


// const userID = require("uuid/v4");

// var PROTO_PATH = __dirname + '/../protos/helloworld.proto';
// var PROTO_PATH = __dirname + './market.proto';
var PROTO_PATH = '../market.proto';

var parseArgs = require('minimist');
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
// var hello_proto = grpc.loadPackageDefinition(packageDefinition).helloworld;
var market_proto = grpc.loadPackageDefinition(packageDefinition).market;

function hashing(file) {
  var hash = 0;
  for (var i = 0; i < file.length; i++) {
      var char = file.charCodeAt(i);
      hash = ((hash<<5)-hash)+char;
      hash = hash & hash;
  }
  return hash;
}

function main() {

  if (process.argv.length <= 2) {
    console.log("\nPlease provide a file.");
  }
  else {
    var argv = parseArgs(process.argv.slice(2), {
      string: 'target'
    });
    var target;
    if (argv.target) {
      target = argv.target;
    } else {
      target = 'localhost:50051';
    }

    // var client = new hello_proto.FileSender(target, grpc.credentials.createInsecure());
    var client = new market_proto.Market(target, grpc.credentials.createInsecure());

    var hashedFile = hashing(argv._[0]);
    // var hashedFile = argv._[0];
    
    var newUser = {
      Id:    1,
      Name:  argv._[1],
      Ip:    argv._[2],
      Port:  argv._[3],
      Price: argv._[4],
    }

    // client.User = {
    //   Id:    1,
    //   Name:  "hi",
    //   Ip:    "localhost",
    //   Port:  416320,
    //   Price: 10,
    // }


    if (argv._.length == 5) {
      // client.registerFile(newUser, hashedFile);
      client.registerFile({user: newUser, fileHash: hashedFile}, function(err, response) {
        console.log(response.message);
      });
      console.log(hashedFile);
    }

    else {
      console.log("\nPlease provide enough information for the file.");
    }
  }
}

main();
