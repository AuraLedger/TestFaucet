const express = require('express');
const config = require('./config.js');
const Web3 = require('web3');
const net = require('net');

const app = express();

const web3 = new Web3(new Web3.providers.IpcProvider(config.ipcPath, net));

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", config.cors);
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

//used to get ip of client
//be sure to put 'proxy_set_header X-Forwarded-For $remote_addr;' in the nginx config
app.enable('trust proxy');

var lastDay = -1;
var ips = {};
var adrs = {};

app.route('/').get((req, res) => {
    res.sendFile('index.html', {root: __dirname});
});

app.route('/balance').get((req, res) => {
    web3.eth.getBalance(config.address, (err, bal) => {
        if(err) {
            console.log(err);
            res.send(err);
        } else
            res.send(Web3.utils.fromWei(bal, 'ether'));
    });
});

app.route('/drip/:address').get((req, res) => {
    var today = new Date().getDay();
    if(today != lastDay) {
        //clear maps
        lastDay = today;
        ips = {};
        adrs = {};
    }

    var ip = req.ip.split(':')[0];
    var adr = req.params.address;
    if(ips.hasOwnProperty(ip) || adrs.hasOwnProperty(adr))
        res.send('Can only use once per day, try again tomorrow');
    else {
        console.log('dripping into ' + adr);
        console.log('from ' + config.address);
        console.log('gas ' + '22000');
        console.log('value ' + config.amount + ' wei ' + Web3.utils.toWei(config.amount, 'ether'));
        console.log('gasPrice: ' + Web3.utils.toWei(config.gasPrice, 'gwei'));
        console.log('chainId: ' + config.chainId);
        web3.eth.accounts.signTransaction({
            from: config.address,
            to: adr,
            value: Web3.utils.toWei(config.amount, 'ether'),
            gas: '22000',
            gasPrice: Web3.utils.toWei(config.gasPrice, 'gwei'),
            chainId: config.chainId,
            data: null
        }, config.privateKey, (err, tx) => {
            if(err) {
                console.log(err);
                res.send(err.message);
            } else {
                web3.eth.sendSignedTransaction(tx.rawTransaction, (err, txHash) => {
                    if(err) {
                        console.log(err);
                        res.send(err.message);
                    } else {
                        ips[ip] = true;
                        adrs[adr] = true;
                        res.send('Success ' + txHash);
                    }
                });
            }
        });
    }
});

app.listen(3005, () => console.log('Faucet listening on port 3005!'));
