var express = require('express');
// var router = express.Router();

var app = express();

var CoinsRoute = require("../controllers/v1/CoinsController");

app.get("/api/v1/get-susu-coin-address", CoinsRoute.updateWalletAddress);
app.post("/api/v1/create-susu-coin-address", CoinsRoute.createUserAddress);
app.post("/api/v1/send-susu-coin-address", CoinsRoute.userSendFund);
app.post("/api/v1/get-user-balance", CoinsRoute.getUserBalance);
app.post("/api/v1/get-user-transaction-list", CoinsRoute.getUserTransactions);
app.get("/api/v1/list-transactions-list", CoinsRoute.getListTransactions);
app.get("/get/v1/get-webhook-data", CoinsRoute.returnWebhookdata);
app.get("/api/v1/get-currency-converted-value", CoinsRoute.getEquivalentValue);


app.use(function (req, res, next) {
    var err = new Error('Resource Not Found');
    err.status = 404;
    var resources = {};
    res.status(404);
    resources.status = err.status;
    resources.message = err.message;
    return res.json(resources);
});

module.exports = app;
