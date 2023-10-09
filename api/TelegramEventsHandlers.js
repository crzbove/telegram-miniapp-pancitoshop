const { INVOICE_TITLE,
    INVOICE_DESCRIPTION, INVOICE_PIC_URL, SUCCESSFUL_PAYMENT_STICKER_FILEID,
    NEW_ORDER_NOTIFICATION_TEXT, ERROR_TEXT,
    SUCCESSFUL_PAYMENT_TEXT, NO_GOODS_TO_RATE_TEXT, WEBAPP_BUTTON_TEXT,
    WEBAPP_URL, HELLO_TEXT, DEFAULT_LANGCODE,
    ORDER_STATUSES, STATUS_UPDATED, STATUS_UPDATED_ERROR,
    THANKYOU_FEEDBACK, WEBAPP_EDITOR_URL, WEBAPP_COURIER_URL } = require('./strings');
const { BOT_TOKEN, PAYMENT_TOKEN, EDITOR_ID, ADMINS_GROUP_CHATID } = require('./secrets');
const {
    CreateOrder, ConfirmPayment, GetUserLastOrderId,
    SetOrderAdress, AddStaff, RemoveStaff,
    GetAvailableOrders, UpdateOrderStatus, GetAvailableFeedbacks,
    UpdateScore,
    CreateOrUpdateUser,
    IsAdmin } = require('./databaseworker');
const { TelegramBot } = require('./lightTeleAPI');

const bot = new TelegramBot(BOT_TOKEN);

// Handling text messages and commands
async function OnMessage(m) {
    await CreateOrUpdateUser(m.from.id, m.from.first_name, m.from.last_name, m.from.username);

    if (m?.text == "/start") {
        await bot.sendMessage(m.chat.id, HELLO_TEXT[m.from.language_code] || HELLO_TEXT[DEFAULT_LANGCODE], {
            inline_keyboard: [[{
                text: WEBAPP_BUTTON_TEXT[m.from.language_code] || WEBAPP_BUTTON_TEXT[DEFAULT_LANGCODE],
                web_app: {
                    url: WEBAPP_URL
                }
            }]]
        });
    }
    else if (m?.text == "/feedback") {
        await bot.deleteMessage(m.chat.id, m.message_id);

        const feedbacksAvailable = await GetAvailableFeedbacks(m.from.id);
        if (feedbacksAvailable.length == 0) {
            await bot.sendMessage(m.chat.id, NO_GOODS_TO_RATE_TEXT[m.from.language_code] || NO_GOODS_TO_RATE_TEXT[DEFAULT_LANGCODE]);
        }
        else {
            const stars = (idsweet) => {
                return [
                    [
                        { text: "⭐", callback_data: `f|${idsweet}|1` },
                        { text: "⭐⭐", callback_data: `f|${idsweet}|2` },
                        { text: "⭐⭐⭐", callback_data: `f|${idsweet}|3` }
                    ],
                    [
                        { text: "⭐⭐⭐⭐", callback_data: `f|${idsweet}|4` },
                        { text: "⭐⭐⭐⭐⭐", callback_data: `f|${idsweet}|5` },
                    ]
                ];
            }
            feedbacksAvailable.forEach(async sweet => {
                await bot.sendMessage(m.from.id, sweet.name, { inline_keyboard: stars(sweet.idsweet) });
            });
        }
    }

    else if (m?.text == "/courier" && IsAdmin(m.chat.id)) {
        await bot.sendMessage(m.chat.id, "Courier App", {
            inline_keyboard: [[{
                text: "View Orders",
                web_app: {
                    url: WEBAPP_COURIER_URL
                }
            }]]
        });
    }

    else if (m?.text == "/editor" && m.chat.id == EDITOR_ID) {
        await bot.sendMessage(m.chat.id, "Web App Editor", {
            inline_keyboard: [[{
                text: "✍️ Editor",
                web_app: {
                    url: WEBAPP_EDITOR_URL
                }
            }]]
        });
    }

    // adding new couriers 
    else if (m?.new_chat_members) {
        if (m.chat.id != ADMINS_GROUP_CHATID) { return; }
        await OnUserAdded(m?.new_chat_members);
    }

    // removing couriers
    else if (m?.left_chat_member) {
        if (m.chat.id != ADMINS_GROUP_CHATID) { return; }
        await OnUserLeft(m?.left_chat_member);
    }

    // action for successful payment
    else if (m?.successful_payment) {
        await OnSuccessfulPayment(m?.successful_payment);
    }
}

// Handling search requests from couriers
async function OnInlineQuery(inline) {
    var results = [];

    if (IsAdmin(inline.from.id)) {
        const orders = await GetAvailableOrders(inline.from.id);

        var inline_keyboard = [];

        orders.forEach((order) => {
            var row = [];
            for (let i = 0; i < Object.keys(ORDER_STATUSES).length; i++) {
                const status_code = Object.keys(ORDER_STATUSES)[i];

                if (status_code == '1') { continue; }

                row.push(
                    {
                        text: ORDER_STATUSES[status_code].TEXT,
                        callback_data: `o|${order.idorder}|${order.iduser}|${status_code}`
                    }
                );

                if (i % 2 == 1 || i == Object.keys(ORDER_STATUSES).length - 1) {
                    inline_keyboard.push(row);
                    row = [];
                }
            }

            results.push({
                type: "article",
                id: order.idorder,
                title: order.address,
                description: order.paid_string,
                thumbnail_url: ORDER_STATUSES[order.status].PIC,
                input_message_content: {
                    message_text: `<b>An order from:</b> ${order.user_info}\n<b>Address:</b> ${order.address}\n<b>Phone number:</b> ${order.phone_number}\n<b>Goods:</b> <i>${order.items}</i>\n<b>Paid:</b> ${order.paid_string}\n`,
                    parse_mode: "HTML"
                },
                reply_markup: {
                    inline_keyboard: inline_keyboard
                }
            });
        });
    }
    await bot.answerInlineQuery(inline.id, results, 0, true);
}

// Handling pressing buttons
async function OnCallback(callback) {
    // Handling feedbacks. Payload: f|idsweet|score
    if (callback.data.split('|')[0] == 'f') {
        const idsweet = callback.data.split('|')[1];
        const score = callback.data.split('|')[2]
        if (await UpdateScore(callback.from.id, idsweet, score)) {
            await bot.answerCallbackQuery(callback.id, THANKYOU_FEEDBACK[callback.from.language_code] || THANKYOU_FEEDBACK[DEFAULT_LANGCODE]);
            await bot.deleteMessage(callback.from.id, callback.message.message_id);
        }
    }

    // Handling courier's pressings. Payload: o|idorder|iduser|status
    else if (callback.data.split('|')[0] == 'o') {
        const parst = callback.data.split('|');
        const idorder = parst[1];
        const iduser = parst[2];
        const statusNew = parst[3];

        if (await UpdateOrderStatus(idorder, callback.from.id, statusNew)) {
            await bot.answerCallbackQuery(callback.id, STATUS_UPDATED[callback.from.language_code] || STATUS_UPDATED[DEFAULT_LANGCODE]);
            await NotifyUser(iduser, statusNew);
        }
        else {
            await bot.answerCallbackQuery(callback.id, STATUS_UPDATED_ERROR[callback.from.language_code] || STATUS_UPDATED_ERROR[DEFAULT_LANGCODE], true);
        }
    }
}

// Checkout
async function OnPrecheckoutQuery(precheckout) {
    // Payload: userid|cakes|language_code
    const userid = parseInt(precheckout.invoice_payload.split('|')[0]);
    const orderId = await CreateOrder(userid);

    if (orderId != null) {
        await bot.answerPreCheckoutQuery(precheckout.id, true);
    }
    else {
        await bot.answerPreCheckoutQuery(precheckout.id, false, ERROR_TEXT);
        await bot.sendMessage(userid, ERROR_TEXT);
    }
}

// Handling successful payment
async function OnSuccessfulPayment(payment) {
    const payload = payment.invoice_payload;
    const userid = parseInt(payload.split('|')[0]); // check CreateInvoiceLink for details (userid|cakes|language_code)
    const langcode = payload.split('|')[2];
    const orderid = await GetUserLastOrderId(userid);
    const address = payment.order_info.shipping_address;
    const phone_number = payment.order_info.phone_number;

    await ConfirmPayment(payment.telegram_payment_charge_id, payment.provider_payment_charge_id, orderid);
    await SetOrderAdress(orderid, address.country_code, address.state, address.city, address.street_line1, address.street_line2, address.post_code, phone_number);
    await bot.sendSticker(userid, SUCCESSFUL_PAYMENT_STICKER_FILEID);
    await bot.sendMessage(userid, SUCCESSFUL_PAYMENT_TEXT[langcode] || SUCCESSFUL_PAYMENT_TEXT[DEFAULT_LANGCODE]);
    await NotifyCouriers();
}

// Adding new staff
async function OnUserAdded(new_chat_members) {
    new_chat_members.forEach(async memeber => {
        await AddStaff(memeber.id, 1);
    });
}

// Removing staff
async function OnUserLeft(left_chat_member) {
    await RemoveStaff(left_chat_member.id);
}

// Forming an incoive link
async function CreateInvoiceLink(user, prices_arr) {
    return await bot.createInvoiceLink(INVOICE_TITLE[user.language_code] || INVOICE_TITLE[DEFAULT_LANGCODE],
        INVOICE_DESCRIPTION[user.language_code] || INVOICE_DESCRIPTION[DEFAULT_LANGCODE],
        `${user.id}|cakes|${user.language_code}`, // invoice_payload
        PAYMENT_TOKEN, "RUB", prices_arr,
        INVOICE_PIC_URL,
        true,
        true,
        false,
        true);
}

// Notify couriers sending them a text message to the group chat
async function NotifyCouriers() {
    await bot.sendMessage(ADMINS_GROUP_CHATID, NEW_ORDER_NOTIFICATION_TEXT);
}

// Notify user about order's status changing
async function NotifyUser(userid, statusNew) {
    await bot.sendMessage(userid, ORDER_STATUSES[statusNew].FRIENDLY_MESSAGE_FOR_USER);
}

async function SetWebhook(url) {
    await bot.setWebhook(url);
}

module.exports = { OnMessage, OnInlineQuery, OnCallback, OnPrecheckoutQuery, OnSuccessfulPayment, OnUserAdded, OnUserLeft, CreateInvoiceLink, SetWebhook, NotifyUser }