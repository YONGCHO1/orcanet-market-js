import { createLibp2p } from 'libp2p'
import { webSockets } from '@libp2p/websockets'
import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { bootstrap } from '@libp2p/bootstrap'
import { identify } from '@libp2p/identify'
import { kadDHT } from '@libp2p/kad-dht'
import { mplex } from '@libp2p/mplex'
import { tcp } from '@libp2p/tcp'
import parallel from 'it-parallel'
import { CID } from 'multiformats/cid'

// Known peers addresses
const bootstrapMultiaddrs = [
  '/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb',
  '/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN'
]

// const node = await createLibp2p({
//   transports: [webSockets()],
//   connectionEncryption: [noise()],
//   streamMuxers: [yamux()],
//   peerDiscovery: [
//     bootstrap({
//       list: bootstrapMultiaddrs, // provide array of multiaddrs
//     })
//   ]
// })

// node.addEventListener('peer:discovery', (evt) => {
//   console.log('Discovered %s', evt.detail.id.toString()) // Log discovered peer
// })

// node.addEventListener('peer:connect', (evt) => {
//   console.log('Connected to %s', evt.detail.toString()) // Log connected peer
// })

let hash = 'bafkreifzjut3te2nhyekklss27nh3k72ysco7y32koao5eei66wof36n5e';
let cid = CID.parse(hash);

const node = await createLibp2p({
  addresses: {
    listen: ['/ip4/0.0.0.0/tcp/0']
  },
  transports: [tcp()],
  streamMuxers: [yamux(), mplex()],
  connectionEncryption: [noise()],
  peerDiscovery: [
    bootstrap({
      list: bootstrapMultiaddrs
    })
  ],
  services: {
    kadDHT: kadDHT({
      kBucketSize: 20
    }),
    identify: identify()
  }
});

const node1 = await createLibp2p({
  addresses: {
    listen: ['/ip4/0.0.0.0/tcp/0']
  },
  transports: [tcp()],
  streamMuxers: [yamux(), mplex()],
  connectionEncryption: [noise()],
  peerDiscovery: [
    bootstrap({
      list: bootstrapMultiaddrs
    })
  ],
  services: {
    kadDHT: kadDHT({
      kBucketSize: 20
    }),
    identify: identify()
  }
});

const node2 = await createLibp2p({
  addresses: {
    listen: ['/ip4/0.0.0.0/tcp/0']
  },
  transports: [tcp()],
  streamMuxers: [yamux(), mplex()],
  connectionEncryption: [noise()],
  peerDiscovery: [
    bootstrap({
      list: bootstrapMultiaddrs
    })
  ],
  services: {
    kadDHT: kadDHT({
      kBucketSize: 20
    }),
    identify: identify()
  }
});


// finding peer nodes
parallel([
  (cb) => node.dial(node1.peerInfo, cb),
  (cb) => node1.dial(node2.peerInfo, cb),
  // timeout
  (cb) => setTimeout(cb, 100)
], (err) => {
  if (err) { throw err }

  // connect node with node2 by only using peerID
  node.peerRouting.findPeer(node2.peerInfo.id, (err, peer) => {
    if (err) { throw err }

    console.log('Found it, multiaddrs are:')
    peer.multiaddrs.forEach((ma) => console.log(ma.toString()))
  })
})

// provide cid in the node
node.contentRouting.provide(cid, (err) => {
  console.log('Get into provide');
  if (err) { throw err }
  
  console.log('Node %s is providing %s', node.peerInfo.id.toString(), cid.toBaseEncodedString())
  
  //find provider using CID 
  node1.contentRouting.findProviders(cid, 5000, (err, providers) => {
    if (err) { throw err }

    console.log('Found provider:', providers[0].id.toString())
  })
})

node.addEventListener('peer:connect', (evt) => {
  const peerId = evt.detail
  console.log('Connection established to:', peerId.toString()) // Emitted when a peer has been found
  peerId.toCID

  // provide cid in the node
  node.contentRouting.provide(cid, (err) => {
    console.log('Get into provide');
    if (err) { throw err }
    
    console.log('Node %s is providing %s', node.peerInfo.id.toString(), cid.toBaseEncodedString())
    
    //find provider using CID 
    node1.contentRouting.findProviders(cid, 5000, (err, providers) => {
      if (err) { throw err }

      console.log('Found provider:', providers[0].id.toString())
    })
  })
})

node.addEventListener('peer:discovery', (evt) => {
  const peerInfo = evt.detail

  console.log('Discovered:', peerInfo.id.toString())
})

