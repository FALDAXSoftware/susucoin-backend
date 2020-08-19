var fetch = require('node-fetch')
var encodeCredentials = require("./encode-auth");

var getTransaction = async (txid) => {
    var transactionDetails;

    var encodeKey = await encodeCredentials.encodeData();

    // Get new address.
    var bodyData = {
        'jsonrpc': '2.0',
        'id': '0',
        'method': 'getrawtransaction',
        'params': [txid]
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
                // console.log(resData)
                transactionDetails = resData.result;
            })
        return transactionDetails;
    } catch (error) {
        console.log("Balance error :: ", JSON.stringify(error));
    }
}

module.exports = {
    getTransaction
}