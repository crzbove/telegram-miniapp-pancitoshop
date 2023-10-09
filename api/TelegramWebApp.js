const crypto = require('crypto');
const { BOT_TOKEN } = require('./secrets');

function GetHash(auth_date, query_id, user) {
    const secret = crypto
        .createHmac('sha256', 'WebAppData')
        .update(BOT_TOKEN);
    const dataCheckString = `auth_date=${auth_date}\nquery_id=${query_id}\nuser=${user}`;
    const hash = crypto
        .createHmac('sha256', secret.digest())
        .update(dataCheckString)
        .digest('hex');

    return hash;
}

function verifyTelegramWebAppData(telegramInitData) {
    try {
        const hash = telegramInitData.hash;
        // check for an old session && compare calculated hash with the given one
        return Math.round(new Date().getTime() / 1000) - parseInt(telegramInitData.auth_date) < 3600 * 24
            && GetHash(telegramInitData.auth_date, telegramInitData.query_id, telegramInitData.user) == hash;
    }
    catch (e) {
        console.error(e);
        return false;
    }
}

module.exports = {
    verifyTelegramWebAppData
}