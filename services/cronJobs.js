var cron = require('node-cron');

// On Every Minute
cron.schedule('* * * * *', async (req, res, next) => {
    console.log("Started cron....");
});