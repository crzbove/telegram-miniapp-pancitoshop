const { OnInlineQuery, OnCallback, OnMessage, OnPrecheckoutQuery, SetWebhook } = require('./TelegramEventsHandlers');

const express = require('express');
var bodyParser = require('body-parser');
const { BOT_WEBHOOK_URL } = require('./strings');
const app = express();
app.use(bodyParser.json({ limit: '5mb' }));

// Handling requests from Telegram
app.post('/bot', async (request, response) => {
    try {
        const body = request.body;
        const message = body?.message;
        const inline = body?.inline_query;
        const callback = body?.callback_query;
        const precheckout = body?.pre_checkout_query;

        if (message) {
            await OnMessage(message);
        }
        else if (inline) {
            if (inline.chat_type != 'sender') { throw false; }
            await OnInlineQuery(inline);
        }
        else if (callback) {
            await OnCallback(callback);
        }
        else if (precheckout) {
            await OnPrecheckoutQuery(precheckout);
        }
    }

    catch (e) {
        console.log(e);
    }
    finally {
        response.sendStatus(200);
    }
});

// Setting a webhook with BOT_WEBHOOK_URL (check strings.js)
app.get('/bot', async (request, response) => {
    await SetWebhook(BOT_WEBHOOK_URL);
    response.sendStatus(200);
})

module.exports = app;
