# Installation
'npm install' in the market directory

# Getting Start
1. Get into the server directory on terminal.
2. Start first bootstrap node
   ```
    node market.js -bootstrap
   ```
3. Start second boot strap node by connecting first node
   ```
    node market.js -bootstrap [multiaddress of first node]
   ```
5. You can see that other peers are discovered and connected.
