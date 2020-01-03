var fetch = require('node-fetch')
var encodeCredentials = require("./encode-auth");

var balanceData = async (address) => {
    var balanceValue;

    var encodeKey = await encodeCredentials.encodeData();

    // Get new address.
    var bodyData = {
        'jsonrpc': '2.0',
        'id': '0',
        'method': 'listreceivedbyaddress'
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
                console.log(resData.result.length)
                var flag = false;
                for (var i = 0; i < resData.result.length; i++) {
                    console.log("resData.result[i].address", resData.result[i].address)
                    if (address == resData.result[i].address) {
                        balanceValue = resData.result[i].amount
                        flag = true;
                    }
                }

                if (flag == false) {
                    balanceValue = 0;
                }
                // sendedFundStatus = resData.result;
            })
        return balanceValue;
    } catch (error) {
        console.log("Balance error :: ", error);
    }
}

module.exports = {
    balanceData
}