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
const constants = require('../../config/constants');
// Controllers
var { AppController } = require('./AppController');
// Models
var UsersModel = require('../../models/v1/UsersModel');
var CoinsModel = require('../../models/v1/CoinsModel');
var WalletModel = require('../../models/v1/WalletModel');
var WalletHistoryModel = require('../../models/v1/WalletHistory');

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
                // .andWhere('is_active', true)
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
                // .andWhere('is_active', true)
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
            var coinData = await CoinsModel
                .query()
                .first()
                // .where('deleted_at', null)
                .andWhere('coin_code', process.env.COIN)
                // .andWhere('is_active', true)
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

                if (walletData != undefined) {

                    var sendObject = {
                        "address": walletData.send_address,
                        "amount": amount,
                        "message": "test"
                    }

                    var userReceiveAddress = await sendHelper.sendData(sendObject);
                    var getTransactionDetails = await transactionDetailHelper.getTransaction(userReceiveAddress);
                    console.log(getTransactionDetails)
                    if (getTransactionDetails != undefined) {

                    }

                    // await WalletModel
                    //     .query()
                    //     .insert({
                    //         "receive_address": userReceiveAddress,
                    //         "send_address": userSendAddress,
                    //         "coin_id": coinData.id,
                    //         "user_id": user_id,
                    //         "deleted_at": null,
                    //         "created_at": Date.now(),
                    //         "wallet_id": "wallet",
                    //         "address_label": label,
                    //         "balance": 0.0,
                    //         "placed_balance": 0.0
                    //     })
                    return res
                        .status(200)
                        .json({
                            "status": 200,
                            "message": "Send Coins successfully."
                        })
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

    async fileValueUpdate(dataValue, flag) {
        return new Promise(async (resolve, reject) => {
            if (flag == 2) {
                fs.unlinkSync('transaction.txt')
            }
            var transactionHash;
            if (fs.existsSync('transaction.txt')) {
                await fs.readFile('transaction.txt', (err, data) => {
                    if (err) {
                        console.log(data)
                    }
                    console.log(data.toString());
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

    async getTransactionData(flag, entries, index, transactionValue) {
        if (flag == false || flag == "false" && entries < 50) {
            var dataValue = await listTransactionHelper.listTransaction(entries, index);
            var flagValue = false;
            for (var i = (dataValue.length - 1); i >= index; i--) {
                console.log(dataValue[i].txid == transactionValue)
                console.log("dataValue >>>>>>>>>", dataValue[i]);
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
                                    'coin_id': walletData.coin_id,
                                    'transaction_type': 'receive',
                                    'transaction_id': dataValue[i].txid,
                                    'user_id': walletData.user_id,
                                    'faldax_fee': 0.0,
                                    'network_fees': (dataValue[i].fee) ? (dataValue[i].fee) : (0.0)
                                })

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

    async returnWebhookdata(req, res) {
        try {
            var transactionHash;
            var transactionValue = await module.exports.fileValueUpdate("", 1)
            var dataValue = await listTransactionHelper.listTransaction(10, 0);
            var data = dataValue[dataValue.length - 1].txid;
            var value = await module.exports.getTransactionData(false, 10, 0, transactionValue)
            var transactionValue = await module.exports.fileValueUpdate(data, 2)
            return res
                .status(200)
                .json({
                    "status": 200
                })
        } catch (error) {
            console.log(error);
        }
    }

}


module.exports = new UsersController();