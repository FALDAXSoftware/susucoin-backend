var fetch = require('node-fetch')
var encodeCredentials = require("./encode-auth");

var balanceData = async () => {
    var balanceValue;
    var encodeKey = await encodeCredentials.encodeData();

    // Get new address.
    var bodyData = {
        "jsonrpc": "2.0",
        "id": "1",
        "method": "getbalance"
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
            // .then(resData => {
            //     console.log(resData)
            //     resData.json()
            // })
            .then(resData => {
                console.log("resData", resData)
                balanceValue = resData.result;
            })
        return balanceValue;
    } catch (error) {
        console.log("Address Generation error :: ", error);
    }
}

module.exports = {
    balanceData
}