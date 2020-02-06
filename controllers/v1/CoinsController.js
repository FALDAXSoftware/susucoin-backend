/**
 * UsersController
 * 
 */
const { raw } = require('objection');
var moment = require('moment');
var fetch = require('node-fetch');
const v = require('node-input-validator');
const Bluebird = require('bluebird');
fetch.Promise = Bluebird;
var bcrypt = require('bcryptjs');
var aesjs = require('aes-js');
var i18n = require("i18n");
var fs = require('file-system');
// Extra
var Helper = require("../../helpers/helpers");
var addressHelper = require("../../helpers/get-new-address");
var sendHelper = require("../../helpers/send");
var balanceHelper = require("../../helpers/get-receiveby-address");
var transactionHelper = require("../../helpers/get-wallet-balance");
var transactionDetailHelper = require("../../helpers/get-transaction");
var listTransactionHelper = require("../../helpers/list-transaction")
var balanceValueHelper = require("../../helpers/get-balance");
var currencyConversionHelper = require("../../helpers/get-currency-conversion");
const constants = require('../../config/constants');
// Controllers
var { AppController } = require('./AppController');
// Models
var UsersModel = require('../../models/v1/UsersModel');
var CoinsModel = require('../../models/v1/CoinsModel');
var WalletModel = require('../../models/v1/WalletModel');
var WalletHistoryModel = require('../../models/v1/WalletHistory');
var TransactionTableModel = require('../../models/v1/TransactionTableModel');

/**
 * Users
 * It's contains all the opration related with users table. Like userList, userDetails,
 * createUser, updateUser, deleteUser and changeStatus
 */
class UsersController extends AppController {

    constructor() {
        super();

    }

    // Get User Address

    async createUserAddress(req, res) {
        try {
            var user_id = req.body.user_id;
            var label = req.body.label;
            var coinData = await CoinsModel
                .query()
                .first()
                .where('deleted_at', null)
                .andWhere('coin_code', process.env.COIN)
                .andWhere('is_active', true)
                .andWhere('type', 2)
                .orderBy('id', 'DESC')

            if (coinData != undefined) {
                var walletData = await WalletModel
                    .query()
                    .first()
                    .where("deleted_at", null)
                    .andWhere("user_id", user_id)
                    .andWhere("coin_id", coinData.id)
                    .orderBy('id', 'DESC')

                console.log("walletData", walletData)

                if (walletData == undefined) {
                    var userReceiveAddress = await addressHelper.addressData();
                    var userSendAddress = await addressHelper.addressData();

                    var dataValue = await WalletModel
                        .query()
                        .insertAndFetch({
                            "receive_address": userReceiveAddress,
                            "send_address": userSendAddress,
                            "coin_id": coinData.id,
                            "user_id": user_id,
                            "deleted_at": null,
                            "created_at": Date.now(),
                            "wallet_id": "wallet",
                            "address_label": label,
                            "balance": 0.0,
                            "placed_balance": 0.0
                        })
                    return res
                        .status(200)
                        .json({
                            "status": 200,
                            "message": "User Address has been created successfully.",
                            "data": dataValue
                        })
                } else {
                    return res
                        .status(400)
                        .json({
                            "status": 400,
                            "message": "Wallet has already been created"
                        })
                }
            } else {
                return res
                    .status(500)
                    .json({
                        "status": 500,
                        "message": "Coin Not Found"
                    })
            }
        } catch (error) {
            console.log(error)
        }
    }

    // Get Warm Wallet and Custody Wallet Address

    async updateWalletAddress(req, res) {
        try {

            var coinData = await CoinsModel
                .query()
                .first()
                .where('deleted_at', null)
                .andWhere('coin_code', process.env.COIN)
                .andWhere('is_active', true)
                .andWhere('type', 2)
                .orderBy('id', 'DESC')

            var getWarmWalletAddress = await addressHelper.addressData();

            var getColdWalletAddress = await addressHelper.addressData();
            await coinData
                .$query()
                .patch({
                    "warm_wallet_address": getWarmWalletAddress,
                    "custody_wallet_address": getColdWalletAddress
                })

            return res
                .status(200)
                .json({
                    "status": 200,
                    "message": "Address Created Successffully."
                })

        } catch (error) {
            console.log("Wallet Address error :: ", error);
        }
    }

    // Send susu coin to User Address

    async userSendFund(req, res) {
        try {
            var user_id = req.body.user_id;
            var amount = req.body.amount;
            var destination_address = req.body.destination_address;
            var faldax_fee = req.body.faldax_fee;
            var network_fee = req.body.network_fee;
            var is_admin = (req.body.is_admin) ? (req.body.is_admin) : false;
            console.log(req.body);
            console.log("is_admin", is_admin)
            var coinData = await CoinsModel
                .query()
                .first()
                .where('deleted_at', null)
                .andWhere('coin_code', process.env.COIN)
                .andWhere('is_active', true)
                .andWhere('type', 2)
                .orderBy('id', 'DESC')

            console.log(coinData);

            if (coinData != undefined) {

                var walletData = await WalletModel
                    .query()
                    .first()
                    .where("deleted_at", null)
                    .andWhere("user_id", user_id)
                    .andWhere("coin_id", coinData.id)
                    .andWhere("is_admin", is_admin)
                    .orderBy('id', 'DESC');

                console.log("walletData", walletData)

                // var getAccountBalance = await balanceValueHelper.balanceData();
                if (walletData != undefined) {
                    console.log("parseFloat(faldax_fee)", parseFloat(faldax_fee))
                    console.log("parseFloat(amount)", parseFloat(amount))
                    var balanceChecking = parseFloat(amount) + parseFloat(faldax_fee) + parseFloat(network_fee);
                    console.log("balanceChecking", balanceChecking)
                    // if (getAccountBalance >= balanceChecking) {
                    if (walletData.placed_balance >= balanceChecking) {
                        var sendObject = {
                            "address": destination_address,
                            "amount": amount,
                            "message": "test"
                        }

                        console.log("sendObject", sendObject)

                        var userReceiveAddress = await sendHelper.sendData(sendObject);
                        var getTransactionDetails = await transactionDetailHelper.getTransaction(userReceiveAddress);
                        console.log("getTransactionDetails", getTransactionDetails)
                        if (getTransactionDetails != undefined) {
                            var balanceUpdate = parseFloat(faldax_fee) + parseFloat(Math.abs(network_fee))
                            var balanceValueUpdate = parseFloat(walletData.balance) - parseFloat(balanceChecking);
                            var placedBlanaceValueUpdate = parseFloat(walletData.placed_balance) - parseFloat(balanceChecking)
                            console.log("balanceValueUpdate", balanceValueUpdate)
                            console.log("placedBlanaceValueUpdate", placedBlanaceValueUpdate)
                            var walletDataUpdate = await WalletModel
                                .query()
                                .where("deleted_at", null)
                                .andWhere("user_id", user_id)
                                .andWhere("coin_id", coinData.id)
                                .andWhere("is_admin", is_admin)
                                .patch({
                                    "balance": balanceValueUpdate,
                                    "placed_balance": placedBlanaceValueUpdate
                                })

                            var walletDetails = await WalletModel
                                .query()
                                .where("deleted_at", null)
                                .andWhere("user_id", user_id)
                                .andWhere("coin_id", coinData.id)
                                .andWhere("is_admin", is_admin)
                                .orderBy('id', 'DESC')

                            console.log("walletDetails", walletDetails)
                            var actual_fee = parseFloat(-(getTransactionDetails.fee)).toFixed(8)
                            var residual_value = parseFloat(0.01) - parseFloat(actual_fee)
                            var transactionData = await WalletHistoryModel
                                .query()
                                .insert({
                                    "source_address": walletData.send_address,
                                    "destination_address": destination_address,
                                    "amount": balanceChecking,
                                    "actual_amount": amount,
                                    "transaction_type": "send",
                                    "created_at": new Date(),
                                    "coin_id": coinData.id,
                                    "transaction_id": getTransactionDetails.txid,
                                    "faldax_fee": faldax_fee,
                                    "actual_network_fees": -(getTransactionDetails.fee),
                                    "estimated_network_fees": 0.01,
                                    "residual_amount": residual_value,
                                    "user_id": walletData.user_id,
                                    "is_admin": is_admin
                                });

                            var transactionValue = await TransactionTableModel
                                .query()
                                .insert({
                                    "source_address": walletData.send_address,
                                    "destination_address": destination_address,
                                    "amount": balanceChecking,
                                    "actual_amount": amount,
                                    "transaction_type": "send",
                                    "created_at": new Date(),
                                    "coin_id": coinData.id,
                                    "transaction_id": getTransactionDetails.txid,
                                    "faldax_fee": faldax_fee,
                                    "actual_network_fees": -(getTransactionDetails.fee),
                                    "estimated_network_fees": 0.01,
                                    "residual_amount": residual_value,
                                    "transaction_from": "Send to Destination",
                                    "user_id": walletData.user_id,
                                    "is_admin": is_admin
                                });

                            var walletBalance = await WalletModel
                                .query()
                                .first()
                                .where("deleted_at", null)
                                .andWhere("coin_id", coinData.id)
                                .andWhere("is_admin", true)
                                .andWhere("user_id", 36)
                                .orderBy('id', 'DESC')

                            if (walletBalance != undefined && faldax_fee > 0) {
                                var updateWalletBalance = await WalletModel
                                    .query()
                                    .where("deleted_at", null)
                                    .andWhere("coin_id", coinData.id)
                                    .andWhere("is_admin", true)
                                    .andWhere("user_id", 36)
                                    .patch({
                                        "balance": parseFloat(walletBalance.balance) + parseFloat(faldax_fee),
                                        "placed_balance": parseFloat(walletBalance.placed_balance) + parseFloat(faldax_fee)
                                    });
                            }

                            var walletValueBalance = await WalletModel
                                .query()
                                .first()
                                .where("deleted_at", null)
                                .andWhere("coin_id", coinData.id)
                                .andWhere("wallet_id", "warm_wallet")
                                .orderBy('id', 'DESC')
                            if (walletValueBalance != undefined) {
                                var updateValueBalance = await WalletModel
                                    .query()
                                    .where("deleted_at", null)
                                    .andWhere("coin_id", coinData.id)
                                    .andWhere("wallet_id", "warm_wallet")
                                    .patch({
                                        "balance": parseFloat(walletValueBalance.balance) + parseFloat(balanceUpdate),
                                        "placed_balance": parseFloat(walletValueBalance.placed_balance) + parseFloat(balanceUpdate)
                                    });
                            }
                        }

                        return res
                            .status(200)
                            .json({
                                "status": 200,
                                "message": "Send Coins successfully."
                            })
                    } else {
                        return res
                            .status(201)
                            .json({
                                "status": 201,
                                "message": "Insufficient Balance in the wallet"
                            })
                    }
                    // } else {
                    //     return res
                    //         .status(201)
                    //         .json({
                    //             "status": 201,
                    //             "message": "Insufficient Actual Balance in the wallet"
                    //         })
                    // }
                } else {
                    return res
                        .status(400)
                        .json({
                            "status": 400,
                            "message": "Wallet Data Not Found"
                        })
                }

            } else {
                return res
                    .status(500)
                    .json({
                        "status": 500,
                        "message": "Coin Not Found"
                    })
            }
        } catch (error) {
            console.log(error)
        }
    }

    // Get User Balance
    async getUserBalance(req, res) {
        try {
            var address = req.body.address;

            var balanceValue = await balanceHelper.getReceiveByAddress(address);
            console.log("balanceValue", balanceValue)
            return res
                .status(200)
                .json({
                    "status": 200,
                    "message": "User Balance has been retrieved successfully",
                    "data": balanceValue
                })
        } catch (error) {
            console.log(error)
        }
    }

    // Get User Transactions Value
    async getUserTransactions(req, res) {
        try {
            var address = req.body.address;

            var transactionList = await transactionHelper.balanceData(address)
            var transactionDetails = [];
            console.log(transactionList)
            for (var i = 0; i < transactionList.length; i++) {
                console.log(transactionList[i])
                var detailValue = await transactionDetailHelper.getTransaction(transactionList[i]);
                console.log("Transaction ID >>>>>>>", transactionList[i], "-------==--------", detailValue);
                var obejct = {
                    "txid": transactionList[i],
                    "details": detailValue.details,
                    "amount": detailValue.amount
                }
                transactionDetails.push(obejct);
            }
            return res
                .status(200)
                .json({
                    "status": 200,
                    "message": "Transaction Details has been retreived Successfully",
                    "data": transactionDetails
                })
        } catch (error) {
            console.log(error)
        }
    }

    // Get List of Transactions
    async getListTransactions(req, res) {
        try {
            var transactionList = await listTransactionHelper.listTransaction()
            console.log(transactionList)
            return res
                .status(200)
                .json({
                    "status": 200,
                    "message": "Transaction Details has been retreived Successfully",
                    "data": transactionList
                })
        } catch (error) {
            console.log(error)
        }
    }

    // Update File trnasaction Value for next webhook
    async fileValueUpdate(dataValue, flag) {
        return new Promise(async (resolve, reject) => {
            if (flag == 2) {
                fs.unlinkSync('transaction.txt')
            }
            var transactionHash;
            if (fs.existsSync('transaction.txt')) {
                await fs.readFile('transaction.txt', (err, data) => {
                    if (err) {
                        console.log(err)
                    }
                    var value = data.toString();
                    transactionHash = value.split(`"`)
                    if (flag == 1) {
                        resolve(transactionHash[1]);
                    }
                })
            } else {
                if (flag == 2) {
                    var value = await fs.writeFile("transaction.txt", JSON.stringify(dataValue), async function (err) {
                        if (err) {
                            console.log(err)
                        } else {
                            value = "File Written Successfully";
                        }
                        return value;
                    })
                    transactionHash = value;
                } else {
                    transactionHash = ''
                }
                resolve(transactionHash);
            }
        })
    }

    // If file transaction value and latest transaction are same then do nothing or if receive then update user wallet
    async getTransactionData(flag, entries, index, transactionValue) {
        if (flag == false || flag == "false" && entries < 50) {
            var dataValue = await listTransactionHelper.listTransaction(entries, index);
            var flagValue = false;
            for (var i = (dataValue.length - 1); i >= index; i--) {
                if (dataValue[i].txid == transactionValue) {
                    flagValue == true;
                    return 1;
                } else if (dataValue[i].category == "receive") {
                    var walletHistoryData = await WalletHistoryModel
                        .query()
                        .first()
                        .where('deleted_at', null)
                        .andWhere('transaction_id', dataValue[i].txid)
                        .andWhere('transaction_type', 'receive')
                        .orderBy('id', 'DESC');

                    if (walletHistoryData == undefined) {
                        var walletData = await WalletModel
                            .query()
                            .first()
                            .select()
                            .where('receive_address', dataValue[i].address)
                            .andWhere('deleted_at', null)
                            .orderBy('id', 'DESC');

                        if (walletData != undefined) {
                            var walletHistoryData = await WalletHistoryModel
                                .query()
                                .insert({
                                    'destination_address': dataValue[i].address,
                                    'created_at': new Date(),
                                    'amount': dataValue[i].amount,
                                    "actual_amount": dataValue[i].amount,
                                    'coin_id': walletData.coin_id,
                                    'transaction_type': 'receive',
                                    'transaction_id': dataValue[i].txid,
                                    'user_id': walletData.user_id,
                                    'faldax_fee': 0.0,
                                    'actual_network_fees': (dataValue[i].fee) ? (dataValue[i].fee) : (0.0),
                                    'estimated_network_fees': 0.01,
                                    "faldax_fee": 0.0,
                                    "residual_amount": 0.0,
                                    "user_id": walletData.user_id,
                                    "is_admin": false
                                })

                            var transactionValue = await TransactionTableModel
                                .query()
                                .insert({
                                    'destination_address': dataValue[i].address,
                                    'created_at': new Date(),
                                    'amount': dataValue[i].amount,
                                    "actual_amount": dataValue[i].amount,
                                    'coin_id': walletData.coin_id,
                                    'transaction_type': 'receive',
                                    'transaction_id': dataValue[i].txid,
                                    'user_id': walletData.user_id,
                                    'faldax_fee': 0.0,
                                    'actual_network_fees': (dataValue[i].fee) ? (dataValue[i].fee) : (0.0),
                                    'estimated_network_fees': 0.01,
                                    "faldax_fee": 0.0,
                                    "residual_amount": 0.0,
                                    "transaction_from": "Destination To Receive",
                                    "user_id": walletData.user_id,
                                    "is_admin": false
                                });

                            var coinData = await CoinsModel
                                .query()
                                .first()
                                .where('deleted_at', null)
                                .andWhere('coin_code', process.env.COIN)
                                .andWhere('is_active', true)
                                .andWhere('type', 2)
                                .orderBy('id', 'DESC')

                            var walletValue = await WalletModel
                                .query()
                                .first()
                                .select()
                                .where('deleted_at', null)
                                .andWhere('coin_id', coinData.id)
                                .andWhere('wallet_id', 'warm_wallet')
                                .orderBy('id', 'DESC');

                            var updatedBalance = parseFloat(walletData.balance) + parseFloat(dataValue[i].amount)
                            var updatedPlacedBalance = parseFloat(walletData.placed_balance) + parseFloat(dataValue[i].amount)

                            var balanceData = await WalletModel
                                .query()
                                .where('receive_address', dataValue[i].address)
                                .andWhere('deleted_at', null)
                                .patch({
                                    'balance': updatedBalance,
                                    'placed_balance': updatedPlacedBalance
                                });

                            if (walletValue != undefined) {
                                var updatedAdminPlacedBalance = parseFloat(walletValue.placed_balance) + parseFloat(dataValue[i].amount);
                                var updatedAdminBalance = parseFloat(walletValue.balance) + parseFloat(dataValue[i].amount);
                                var updateValue = await WalletModel
                                    .query()
                                    .where('deleted_at', null)
                                    .andWhere('coin_id', coinData.id)
                                    .andWhere('is_admin', true)
                                    .patch({
                                        'balance': updatedAdminBalance,
                                        'placed_balance': updatedAdminPlacedBalance
                                    })
                            }
                        }
                    }
                }
                if (flagValue == true) {
                    break;
                }
            }
            if (flagValue == true) {
                return 1;
            } else {
                await module.exports.getTransactionData(false, (entries + 10), (index + 10))
            }
        } else {
            return 1;
        }
    }

    // Webhook for transaction history
    async returnWebhookdata() {
        try {
            console.log("ISNIDE METHOD")
            var transactionHash;
            var transactionValue = await module.exports.fileValueUpdate("", 1)
            var dataValue = await listTransactionHelper.listTransaction(10, 0);
            var data = dataValue[dataValue.length - 1].txid;
            var value = await module.exports.getTransactionData(false, 10, 0, transactionValue)
            var transactionValue = await module.exports.fileValueUpdate(data, 2)
        } catch (error) {
            console.log(error);
        }
    }

    async getEquivalentValue(req, res) {
        try {
            var data = await currencyConversionHelper.convertValue();
            return res
                .status(200)
                .json({
                    "status": 200,
                    "message": "Currency Value has been retrieved successfully",
                    "data": data
                })
        } catch (error) {
            console.log(error);
        }
    }
}


module.exports = new UsersController();