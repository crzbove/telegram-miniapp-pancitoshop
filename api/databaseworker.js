const { Pool } = require('pg');

// To execute plpgsql functions
async function RunFunction(funcName, paramsArr) {
    const pool = new Pool();
    const client = await pool.connect();

    // creating a secure string for prepared statement
    funcName += "(";
    for (let i = 1; i <= paramsArr.length; i++) {
        funcName += "$" + i;
        if (i != paramsArr.length) { funcName += ", "; }
    }
    funcName += ")";
    let response = null;
    try {
        response = (await client.query('select * from ' + funcName, paramsArr)).rows;
    }
    finally {
        client.release();
        return response;
    }
}

// To see views/tables
async function SeeView(viewName) {
    const pool = new Pool();
    const client = await pool.connect();
    let response = null;
    try {
        response = (await client.query('select * from ' + viewName, [])).rows;
    }
    finally {
        client.release();
        return response;
    }
}

async function CreateOrUpdateUser(id, first_name, last_name, username) {
    await RunFunction('user_create_or_update', [id, first_name, last_name, username]);
}

async function CreateCategory(name, description) {
    await RunFunction('category_create', [name, description]);
}

async function ConfirmPayment(telegram_payment_charge_id, provider_payment_charge_id, orderid) {
    await RunFunction('order_update_payment_charge', [telegram_payment_charge_id, provider_payment_charge_id, orderid]);
}

async function GetCart(userid) {
    return await RunFunction('cart_items_getuser', [userid]);
}
async function CreateOrder(userid) {
    const res = await RunFunction('order_create', [userid]);
    return res[0].order_create;
}
async function GetUserLastOrderId(userid) {
    return (await RunFunction('order_getid_byuserid', [userid]))[0].order_getid_byuserid;
}
async function SetOrderAdress(orderid, country_code, state, city, street_line1, street_line2, post_code, phone_number) {
    post_code = parseInt(post_code);
    await RunFunction('order_update_address', [orderid, country_code, state, city, street_line1, street_line2, post_code, phone_number]);
}
async function AddStaff(userid, staff_level) {
    await RunFunction('staff_create', [userid, staff_level]);
}
async function RemoveStaff(userid) {
    await RunFunction('staff_remove', [userid]);
}

async function IsAdmin(userid) {
    return (await RunFunction('staff_check', [userid]))[0].staff_check;
}

async function GetAdmins() {

    return await SeeView('admins_v');

}
async function GetSweets(categoryid = "", userid = -1) {
    if (categoryid == "") {
        if (userid != -1) {
            return await RunFunction('sweets_getall', [userid]);
        }
        else {
            return await SeeView('sweets_v');
        }
    }
    else if (categoryid == "liked") {
        return await RunFunction('likes_v_getsweets', [userid]);
    }
    else if (categoryid == "popular") {
        return await RunFunction('get_recommendations', [userid]);
    }
    else {
        return await RunFunction('sweets_and_categories_v_getsweets', [categoryid, userid]);
    }
}
async function AddToCart(idsweet, iduser, count) {
    await RunFunction('cart_add', [idsweet, iduser, count]);
}
async function GetAllCategories() {
    return await SeeView('categories_v');
}
async function GetAvailableOrders(idcourier) {
    return await RunFunction('orders_get_available', [idcourier]);
}
async function UpdateOrderStatus(idorder, idcourier, statusNew) {
    return (await RunFunction('order_update_status', [idorder, idcourier, statusNew]))[0].order_update_status;
}
async function GetAvailableFeedbacks(iduser) {
    return await RunFunction('get_available_feedbacks', [iduser]);
}
async function UpdateScore(iduser, idsweet, score) {
    return (await RunFunction('order_items_list_update_score', [iduser, idsweet, score]))[0].order_items_list_update_score;
}
async function AddToFavorites(idsweet, iduser) {
    await RunFunction('favorite_add', [idsweet, iduser]);
}

async function CreateSweet(name, cost, discount, wt, description, picture_base64, quantity, categories) {
    await RunFunction('sweet_create', [name, cost, discount, wt, description, picture_base64, quantity, categories]);
}

async function GetCategoriesAndSweets() {
    return await SeeView('sweets_categories_list_v');
}

async function AddCategoryToSweet(idsweet, idcategory) {
    return await RunFunction('categories_list_add', [idsweet, idcategory]);
}
async function RemoveCategoryFromSweet(idsweet, idcategory) {
    return await RunFunction('categories_list_remove', [idsweet, idcategory]);
}

async function UpdateSweet(idsweet, cost, discount, quantity) {
    return await RunFunction('sweets_update', [idsweet, cost, discount, quantity]);
}

async function RemoveSweet(idsweet) {
    return await RunFunction('sweets_remove', [idsweet]);
}
async function UpdateCategory(id, name, description) {
    return await RunFunction('category_update', [id, name, description]);
}
async function DeleteCategory(id) {
    return await RunFunction('category_delete', [id]);
}

async function GetUsers() {
    return await SeeView('users_v');
}

async function UpdateDiscount(iduser, discount) {
    return await RunFunction('user_update_discount', [iduser, discount]);
}

module.exports = {
    CreateOrUpdateUser, GetCart, CreateOrder,
    ConfirmPayment, GetUserLastOrderId, SetOrderAdress,
    AddStaff, RemoveStaff, IsAdmin,
    GetAdmins, GetSweets, AddToCart,
    GetAllCategories, GetAvailableOrders, UpdateOrderStatus,
    GetAvailableFeedbacks, UpdateScore, AddToFavorites,
    CreateSweet, GetCategoriesAndSweets,
    AddCategoryToSweet, RemoveCategoryFromSweet,
    UpdateSweet, RemoveSweet,
    CreateCategory, UpdateCategory, DeleteCategory,
    GetUsers, UpdateDiscount
}