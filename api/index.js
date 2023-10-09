const { CreateInvoiceLink, NotifyUser } = require('./TelegramEventsHandlers');
const express = require('express');
var bodyParser = require('body-parser');
const app = express();
const cors = require('cors');

const { verifyTelegramWebAppData } = require('./TelegramWebApp');

const { GetCart, GetSweets, UpdateDiscount,
    AddToCart, GetAllCategories, AddToFavorites,
    CreateSweet, GetCategoriesAndSweets, AddCategoryToSweet,
    RemoveCategoryFromSweet, UpdateSweet, RemoveSweet,
    UpdateCategory, DeleteCategory, CreateCategory,
    GetUsers,
    IsAdmin,
    GetAvailableOrders,
    UpdateOrderStatus } = require('./databaseworker');
const { EDITOR_ID } = require('./secrets');

const CORS_whitelist = ['https://shop.panci.to', 'https://pancitoshop.vercel.app', 'http://localhost:3000'];

const corsOptions = {
    origin: function (origin, callback) {
        if (CORS_whitelist.indexOf(origin) !== -1 || !origin) {
            callback(null, true);
        } else {
            callback(new Error('not allowed by CORS, check CORS_whitelist ' + origin));
        }
    }
};

app.use(bodyParser.json({ limit: '5mb' }));
app.use(cors(corsOptions));

app.get('/api/:type', async (request, response) => {
    if (!verifyTelegramWebAppData(request.query)) {
        response.sendStatus(401);
        return;
    }

    const user = JSON.parse(request.query.user);
    if (request.params.type == "sweets") {
        if (!Object.keys(request.query).includes('idcategory')) {
            response.json(await GetSweets("", user.id));
        }
        else {
            response.json(await GetSweets(request.query.idcategory, user.id));
        }
    }
    else if (request.params.type == "categories") {
        response.json(await GetAllCategories());
    }
    else if (request.params.type == "invoice") {
        var invoice;
        const prices = await GetCart(user.id);

        invoice = await CreateInvoiceLink(user, prices);
        response.json(invoice.ok ? invoice.result : "error");
    }
});
app.post('/api/:type', async (request, response) => {
    if (!verifyTelegramWebAppData(request.query)) {
        response.sendStatus(401);
        return;
    }

    if (request.params.type == "add_cart") {
        const cart = request.body;
        const user = JSON.parse(request.query.user);
        var idssweet = [];
        var counts = [];
        cart.forEach(element => {
            idssweet.push(element.idsweet);
            counts.push(element.count);
        });

        var result = await AddToCart(idssweet, user.id, counts);
        response.json(result);
    }
    else if (request.params.type == "like") {
        const user = JSON.parse(request.query.user);
        await AddToFavorites(request.body.idsweet, user.id);
        response.json({ ok: true });
    }
});

app.get('/admin-api/:type', async (request, response) => {
    const user = JSON.parse(request.query.user);
    if (!(verifyTelegramWebAppData(request.query) && user.id == EDITOR_ID)) {
        response.sendStatus(401);
        return;
    }

    let result = null;
    switch (request.params.type) {
        case "getcategories":
            result = await GetAllCategories();
            break;
        case "sweets":
            result = await GetSweets();
            break;
        case "getsweetscategories":
            result = await GetCategoriesAndSweets();
            break;
        case "getusers":
            result = await GetUsers();
            break;
    }
    response.json(result);
});

app.post('/admin-api/:type', async (request, response) => {
    const user = JSON.parse(request.query.user);
    if (!(verifyTelegramWebAppData(request.query) && user.id == EDITOR_ID)) {
        response.sendStatus(401);
        return;
    }
    const body = request.body;
    var result = "";

    switch (request.params.type) {
        case "getcategories":
            result = await GetAllCategories();
            break;
        case "addsweet":
            result = await CreateSweet(body.name, body.cost, body.discount, body.wt, body.description, body.picture_base64, body.quantity, body.categories);
            break;
        case "createcategory":
            result = await CreateCategory(body.name, body.description);
            break;
        case "sw_category_add":
            result = await AddCategoryToSweet(body.idsweet, body.idcategory);
            break;
        case "sw_category_remove":
            result = await RemoveCategoryFromSweet(body.idsweet, body.idcategory);
            break;
        case "updatesweet":
            result = await UpdateSweet(body.idsweet, body.cost, body.discount, body.quantity);
            break;
        case "updatecategory":
            result = await UpdateCategory(body.id, body.name, body.description);
            break;
        case "updatediscount":
            result = await UpdateDiscount(body.iduser, body.discount);
            break;
        case "deletesweet":
            result = await RemoveSweet(body.idsweet);
            break;
        case "deletecategory":
            result = await DeleteCategory(body.id);
            break;
    }

    response.json(result);
});

app.get('/courier-api/:type', async (request, response) => {
    const user = JSON.parse(request.query.user);
    if (!(verifyTelegramWebAppData(request.query) && IsAdmin(user.id))) {
        response.sendStatus(401);
        return;
    }

    var result = "";

    switch (request.params.type) {
        case "getavailableorders":
            result = await GetAvailableOrders(user.id);
            break;
    }

    response.json(result);
});

app.post('/courier-api/:type', async (request, response) => {
    const user = JSON.parse(request.query.user);
    if (!(verifyTelegramWebAppData(request.query) && IsAdmin(user.id))) {
        response.sendStatus(401);
        return;
    }

    const body = request.body;
    var result = "";

    switch (request.params.type) {
        case "updatestatus":
            result = await UpdateOrderStatus(body.idorder, user.id, body.statusnew);
            if (result === true) {
                await NotifyUser(user.id, body.statusnew);
            }
            break;
    }

    response.json(result);
});

module.exports = app;