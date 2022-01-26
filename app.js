const https = require('https');
const express = require("express");
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require("firebase-admin/firestore");

require("dotenv").config();

const firebaseApp = initializeApp();
console.log(firebaseApp.name);
console.log(firebaseApp.options);

const port = process.env.PORT || 3000;
const app = express();
/*
* import checksum generation utility
* You can get this utility from https://developer.paytm.com/docs/checksum/
*/
const PaytmChecksum = require('paytmchecksum');
const { sendMessage } = require('./firebase_message');

app.use(express.json());
app.use(express.urlencoded());

app.get('/', (req, res) => {
  console.log(req);
  res.send(JSON.stringify({ Hello: 'World' }));
});
app.post("/txnToken", (req, res) => {
  console.log(req.body);
  const { amount, orderId } = req.body;
  getTxn(amount, orderId, (response) => {
    res.json(JSON.parse(response).body);
  });
})
const db = getFirestore();
app.post("/dispatch", async (req, res) => {
  console.log(req.body);
  const { resId, orderId } = req.body;
  const resultDel = await db.collection(`restaurants/${resId}/orders`).doc(orderId).delete();
  console.log(resultDel);
  sendMessage(req.body);
  res.status(201).send("sent");
})

function getTxn(amount, orderId, cb) {
  var paytmParams = {};

  paytmParams.body = {
    "requestType": "Payment",
    "mid": "AuBWYM25312044824474",
    "websiteName": "WEBSTAGING",
    "orderId": orderId,
    // "callbackUrl": "https://jeenius.gq",
    "txnAmount": {
      "value": amount,
      "currency": "INR",
    },
    "userInfo": {
      "custId": "CUST_001",
    },
  };
  /*
  * Generate checksum by parameters we have in body
  * Find your Merchant Key in your Paytm Dashboard at https://dashboard.paytm.com/next/apikeys 
  */
  PaytmChecksum.generateSignature(JSON.stringify(paytmParams.body), "01lps9#PUnnVVH1V").then(function (checksum) {

    paytmParams.head = {
      "signature": checksum
    };

    var post_data = JSON.stringify(paytmParams);

    var options = {

      /* for Staging */
      hostname: 'securegw-stage.paytm.in',

      /* for Production */
      // hostname: 'securegw.paytm.in',

      port: 443,
      path: '/theia/api/v1/initiateTransaction?mid=AuBWYM25312044824474&orderId=' + orderId,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': post_data.length
      }
    };

    var response = "";
    var post_req = https.request(options, function (post_res) {
      post_res.on('data', function (chunk) {
        response += chunk;
      });

      post_res.on('end', function () {
        console.log('Response: ', response);
        cb(response);
      });
    });

    post_req.write(post_data);
    post_req.end();
  });
}
app.listen(port, () => {
  console.log("Server started on " + port);
});