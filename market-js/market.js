import { createRequire } from "module";
const require = createRequire(import.meta.url);

import { createLibp2p } from 'libp2p'
import { bootstrap } from '@libp2p/bootstrap'
import { tcp } from '@libp2p/tcp'
import { mplex } from '@libp2p/mplex'
import { noise } from '@chainsafe/libp2p-noise'
import { kadDHT } from '@libp2p/kad-dht'
import { mdns } from '@libp2p/mdns'
import { multiaddr } from '@multiformats/multiaddr'


// const bootstrapPeers1 = ['/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb',
//                         '/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN']; // your bootstrap peers

var PROTO_PATH = './market.proto';

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

const bootstrapPeers = [];

const makeNode = async () => {
    const nodes = await createLibp2p({
        addresses: {
            listen: ['/ip4/0.0.0.0/tcp/0']
        },
        transports: [tcp()],
        streamMuxers: [mplex()],
        connectionEncryption: [noise()],
        peerDiscovery: [mdns()],
        // peerDiscovery: [bootstrap()],
        services: {
            kadDHT: kadDHT({
                kBucketSize: 20
            }),
        }
    });

    await nodes.start();
    return nodes;
}


// Create new node and start it
const node = await makeNode();

// Put or update values to corresponding key
function putOrUpdateKeyValue(node, cid, value) {
    node.contentRouting.get(cid, (err, existingValue) => {
        // The key(CID) doesn't exist in DHT node
        if (err) {
            console.log('First time to register the file');
            node.contentRouting.put(cid, value, (err) => {
                if (err) {
                console.error('Error registering value:', err);
                } 
                else {
                console.log('Value uploaded successfully for key', cid);
                }
            })
        } 

        // The key(CID) exists in DHT node
        else {
          // Update existing value with new value (might be needed to change to add with existing value)
          const updatedValue = Array.isArray(existingValue) ? [...existingValue, ...value] : [existingValue, ...value];
          node.contentRouting.put(cid, updatedValue, (err) => {
            if (err) {
              console.error('Error updating value:', err);
            } 
            else {
              console.log('Value updated successfully for key', cid);
            }
          });
        }
    });
}

// Check provider based on provided key
function checkProvider(node, cid) {
    node.contentRouting.get(cid, (err, existingValue) => {
        // The key(CID) doesn't exist in DHT node
        if (err) {
            console.error('Error retrieving existing value:', err);
            return;
        } 

        // The key(CID) exists in DHT node
        else {
          return existingValue;
        }
    });
}

// This function registers a file and user into the servers HashMap 
function registerFile(call, callback) {

    let newUser = call.request.user;
    let cid = call.request.fileHash;
    console.log("------------------register file---------------------");
  
  
  
    let multi = [];
    multi.push(newUser);
  
    putOrUpdateKeyValue(node, cid, multi)
  
    
    // // old way to add data
    // if (userFileMap.has(fileHash)) {
    //   console.log("File already exist");
      
    //   let newMap = multi.concat(userFileMap.get(fileHash));
      
    //   userFileMap.set(fileHash, newMap);
    // }
    // else {
    //   console.log("File doesn't exist");
    //   userFileMap.set(fileHash, multi);
    // }
  
    // printMarket();
    // callback(null, {
    //   message: "File " + fileHash + " from " + newUser.name + "'s "
    //     + newUser.ip + ":" + newUser.port + " with price: $"
    //     + newUser.price + " per MB added successfully"
    // }); // ?
    callback(null, {});
}

// CheckHolders should take a fileHash and looks it up in the hashmap and returns the list of users
function checkHolders(call, callback) {
    console.log("------------------check holders----------------------");
    const cid = call.request.fileHash;
    // const user = userFileMap.get(fileHash);

    const holders = checkProvider(node, cid) 
  
    console.log("Users Found");
    printHolders(holders);
    callback(null, {holders: holders});
}

async function main() {

    var argv = process.argv.slice(2);

    console.log(argv[1]);

    switch (argv[0]) {
        case '-bootstrap':
            if (argv[1] === undefined)
                break;
            else
                // add bootstrap node through process
                bootstrapPeers.push(argv[1]);
            break;
        case '-clientMode':

    }

    // Create new node and start it
    // const node = await makeNode();

    console.log('Peer ID:', node.peerId.toString());
    console.log('Connect to me on:');
    const multiaddresses = node.getMultiaddrs();
    multiaddresses.forEach(addr => console.log(addr.toString()));

    const bootstrapAddresses = await Promise.all(bootstrapPeers.map(async (addr) => {
        console.log("get into bootstrap function");
        try {
            console.log("get into try");
            console.log(addr);
            const peerAddr = multiaddr(addr);
            const peerInfo = await node.dial(peerAddr, {
                signal: AbortSignal.timeout(10_000)
            });

            console.log('Connected to bootstrap peer:', peerInfo.id.toString());
            return peerInfo;
        } catch (error) {
            console.error('Failed to connect to bootstrap peer:', error);
            return null;
        }
    }));

    // const dht1 = new kadDHT({
    //     libp2p: node,
    //     validator: {
    //         validate: (key, value) => null,
    //         select: (key, records) => [0, null]
    //     }
    // });


    // const dht2 = await makeNode();

    const dht = await createLibp2p({
        addresses: {
            listen: ['/ip4/0.0.0.0/tcp/0']
        },
        transports: [tcp()],
        streamMuxers: [mplex()],
        connectionEncryption: [noise()],
        peerDiscovery: [
            bootstrap({
                list: bootstrapAddresses.filter(addr => addr !== null)
              })
        ],
        services: {
            kadDHT: kadDHT({
              kBucketSize: 20
            }),
        }
    });

    if (bootstrapAddresses.length === 0) {
        await new Promise(() => { }); // Keep the program running
    }
    else {
        const dht = await createLibp2p({
            addresses: {
                listen: ['/ip4/0.0.0.0/tcp/0']
            },
            transports: [tcp()],
            streamMuxers: [mplex()],
            connectionEncryption: [noise()],
            peerDiscovery: [
                bootstrap({
                    list: bootstrapAddresses.filter(addr => addr !== null)
                  })
            ],
            services: {
                kadDHT: kadDHT({
                  kBucketSize: 20
                }),
            }
        });

        await dht.start();
    }


    // await dht.start();
    // await dht.bootstrap(bootstrapAddresses.filter(addr => addr !== null));

    // const routingDiscovery1 = node.discovery.create(dht.discovery);
    // const routingDiscovery = node.peerRouting.findPeer(dht.peerId);
    // routingDiscovery.advertise('orcanet/market');
    // routingDiscovery.on('peer', (peerInfo) => {
    //     console.log('Discovered peer:', peerInfo.id.toB58String());
    //     node.connect(peerInfo)
    //         .then(() => console.log('Connected to peer:', peerInfo.id.toB58String()))
    //         .catch((error) => console.error('Failed to connect to peer:', peerInfo.id.toB58String(), error));
    // });

    const server = new grpc.Server();
    server.addService(market_proto.Market.service, { RegisterFile: registerFile, CheckHolders: checkHolders });
    server.bindAsync('0.0.0.0:50051', grpc.ServerCredentials.createInsecure(), () => {
        server.start();
    });  

    await new Promise(() => { }); // Keep the program running
}

main().catch((error) => {
    console.error('Error:', error);
    process.exit(1);
});
