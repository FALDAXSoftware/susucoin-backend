var fetch = require('node-fetch')
var encodeCredentials = require("./encode-auth");

var sendData = async (sendInfo) => {
    var sendedFundStatus;
    var encodeKey = await encodeCredentials.encodeData();

    console.log(encodeKey)
    console.log(sendInfo)

    //Body Data for sending funds
    var bodyData = {
        'jsonrpc': '2.0',
        'id': '0',
        'method': 'sendtoaddress',
        'params': [sendInfo.address, sendInfo.amount, sendInfo.message]
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
                console.log("resData", resData)
                sendedFundStatus = resData.result;
            })
        return sendedFundStatus;
    } catch (error) {
        console.log("Send fund error :: ", error);
    }
}

module.exports = {
    sendData
}