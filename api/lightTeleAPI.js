const axios = require('axios').default;

class TelegramBot {
    #METHODS = {
        answerCallbackQuery: "answerCallbackQuery", answerInlineQuery: "answerInlineQuery",
        sendMessage: "sendMessage", editMessageText: "editMessageText",
        deleteMessage: "deleteMessage", createInvoiceLink: "createInvoiceLink",
        answerPreCheckoutQuery: "answerPreCheckoutQuery",
        sendSticker: "sendSticker",
        setWebhook: "setWebhook"
    };
    #_TOKEN;
    #_APIBASEURL;
    #getURI(method) {
        return this.#_APIBASEURL + method;
    }
    constructor(TOKEN) {
        this.#_TOKEN = TOKEN;
        this.#_APIBASEURL = "https://api.telegram.org/bot" + this.#_TOKEN + "/";
    }

    async answerInlineQuery(inline_query_id, results_arr, cache_time = 900, is_personal = true) {
        await axios.post(this.#getURI(this.#METHODS.answerInlineQuery), {
            "inline_query_id": inline_query_id,
            "results": results_arr,
            "cache_time": cache_time,
            "is_personal": is_personal
        });
    }

    async sendMessage(chat_id, text, reply_markup, reply_to_message_id = -1, disable_web_page_preview = true) {
        return (await axios.post(this.#getURI(this.#METHODS.sendMessage), {
            "chat_id": chat_id,
            "text": text,
            "parse_mode": "HTML",
            "reply_to_message_id": reply_to_message_id == -1 ? null : reply_to_message_id,
            "reply_markup": reply_markup,
            "disable_web_page_preview": disable_web_page_preview
        })).data;
    }

    async sendSticker(chat_id, sticker_file_id) {
        return (await axios.post(this.#getURI(this.#METHODS.sendSticker), {
            "chat_id": chat_id,
            "sticker": sticker_file_id
        })).data;
    }

    async editMessageText(text, chat_id, message_id, reply_markup = {}) {
        await axios.post(this.#getURI(this.#METHODS.editMessageText), {
            "chat_id": chat_id,
            "message_id": message_id,
            "text": text,
            "parse_mode": "HTML",
            "reply_markup": reply_markup,
            "disable_web_page_preview": true
        });
    }

    async answerCallbackQuery(callback_query_id, text = "", show_alert = false) {
        await axios.post(this.#getURI(this.#METHODS.answerCallbackQuery), {
            "callback_query_id": callback_query_id,
            "text": text,
            "show_alert": show_alert
        });
    }

    async deleteMessage(chat_id, message_id) {
        await axios.post(this.#getURI(this.#METHODS.deleteMessage), {
            "chat_id": chat_id,
            "message_id": message_id
        });
    }

    async createInvoiceLink(title, description, payload, provider_token, currency, prices, photo_url, need_name,
        need_phone_number, need_email, need_shipping_address) {
        return (await axios.post(this.#getURI(this.#METHODS.createInvoiceLink), {
            "title": title,
            "description": description,
            "payload": payload,
            "provider_token": provider_token,
            "currency": currency,
            "prices": prices,
            "photo_url": photo_url,
            "need_name": need_name,
            "need_phone_number": need_phone_number,
            "need_email": need_email,
            "need_shipping_address": need_shipping_address
        })).data;
    }

    async answerPreCheckoutQuery(pre_checkout_query_id, ok, error_message) {
        await axios.post(this.#getURI(this.#METHODS.answerPreCheckoutQuery), {
            "pre_checkout_query_id": pre_checkout_query_id,
            "ok": ok,
            "error_message": error_message
        });
    }

    async setWebhook(url) {
        await axios.post(this.#getURI(this.#METHODS.setWebhook), {
            "url": url,
            "drop_pending_updates": true
        });
    }
}

module.exports = {
    TelegramBot
}