var base64 = require('base-64');

var encodeData = () => {
    return new Promise(async (resolve, reject) => {

        var rpccall = process.env.SUSU_USER + ':' + process.env.SUSU_PASSWORD;

        var encodedDataValue = base64.encode(rpccall);
        resolve(encodedDataValue)
    })
}

module.exports = {
    encodeData
}