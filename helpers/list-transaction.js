var fetch = require('node-fetch')
var encodeCredentials = require("./encode-auth");

var listTransaction = async (txid) => {
    var transactionData;

    var encodeKey = await encodeCredentials.encodeData();

    // Get new address.
    var bodyData = {
        'jsonrpc': '2.0',
        'id': '0',
        'method': 'listtransactions'
    }

    try {

        await fetch(process.env.SUSU_URL, {
            method: 'POST',
            body: JSON.stringify(bodyData),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + encodeKey
            }
        })
            .then(resData => resData.json())
            .then(resData => {
                console.log(resData.result)
                transactionData = resData.result;
            })
        return transactionData;
    } catch (error) {
        console.log("Balance error :: ", error);
    }
}

module.exports = {
    listTransaction
}