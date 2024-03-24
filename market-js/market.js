import { createRequire } from "module";
const require = createRequire(import.meta.url);

import { createLibp2p } from 'libp2p'
import { bootstrap } from '@libp2p/bootstrap'
import { tcp } from '@libp2p/tcp'
import { mplex } from '@libp2p/mplex'
import { noise } from '@chainsafe/libp2p-noise'
import { kadDHT } from '@libp2p/kad-dht'
import { mdns } from '@libp2p/mdns'
import { CID } from 'multiformats/cid'
import crypto from 'node:crypto'
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
    const node = await makeNode();

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
            console.log("peerAddr is " + peerAddr);
            // const peerInfo = await node.peerInfo.create(undefined, [peerAddr]);
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

    // const dht = await createLibp2p({
    //     addresses: {
    //         listen: ['/ip4/0.0.0.0/tcp/0']
    //     },
    //     transports: [tcp()],
    //     streamMuxers: [mplex()],
    //     connectionEncryption: [noise()],
    //     peerDiscovery: [
    //         bootstrap({
    //             list: bootstrapAddresses.filter(addr => addr !== null)
    //           })
    //     ],
    //     services: {
    //         kadDHT: kadDHT({
    //           kBucketSize: 20
    //         }),
    //     }
    // });


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

    // Your putValue and searchKey logic goes here

    await new Promise(() => { }); // Keep the program running
}

main().catch((error) => {
    console.error('Error:', error);
    process.exit(1);
});
