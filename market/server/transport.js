import { createLibp2p } from 'libp2p'
import { webSockets } from '@libp2p/websockets'
import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { bootstrap } from '@libp2p/bootstrap'
import { identify } from '@libp2p/identify'
import { kadDHT } from '@libp2p/kad-dht'
import { mplex } from '@libp2p/mplex'
import { tcp } from '@libp2p/tcp'

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
  })
  
  node.addEventListener('peer:connect', (evt) => {
    const peerId = evt.detail
    console.log('Connection established to:', peerId.toString()) // Emitted when a peer has been found
  })
  
  node.addEventListener('peer:discovery', (evt) => {
    const peerInfo = evt.detail
  
    console.log('Discovered:', peerInfo.id.toString())
  })