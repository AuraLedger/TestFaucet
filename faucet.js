const express = require('express');
const config = require('./config.js');
const Web3 = require('Web3');
const net = require('net');

const app = express();

const web3 = new Web3(new Web3.providers.IpcProvider(config.ipcPath, net));

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", config.cors);
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});a

//used to get ip of client
//be sure to put '' in the nginx config
app.enable('trust proxy');

var lastDay = -1;
var ips = {};
var adrs = {};

app.route('/:address').get((req, res) => {
    var today = new Date().getDay();
    if(today != lastDay) {
        //clear maps
        ips = {};
        adrs = {};
    }

    var ip = req.ip.split(':')[0];
    var adr = req.params.address;
    if(ips.hasOwnProperty(ip) || adrs.hasOwnProperty(adr))
        res.send('Can only use once per day, try again tomorrow');
    else {
        web3.sendTransaction
        web3.eth.accounts.signTransaction({
            from: config.address,
            to: adr,
            value: web3.utils.toWei(config.amount, 'ether')
        }, config.privateKey, (err, tx) {
            if(err) {
                console.log(err);
                res.send(err);
            } else {
                web3.eth.sendSignedTransaction(tx.rawTransaction, (err, txHash) {
                    if(err) {
                        console.log(err);
                        res.send(err);
                    } else {
                        ips[ip] = true;
                        adrs[adr] = true;
                        res.send('Success ' + txHash);
                    }
                });
            }
        });
    }
);

app.listen(3005, () => console.log('Example app listening on port 3005!'))
