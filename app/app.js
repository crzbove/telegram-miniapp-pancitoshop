var cart = []; // { Good UUID: count}
var GOODS; // All goods
LIKED_COLOR = "#FF2929";
UNLIKED_COLOR = "#FFFFFF";

const DEFAULT_LANGCODE = "en";
const USERLANGCODE = Telegram.WebApp.initDataUnsafe.user.language_code;
const MIN_AMOUNT = 106.05;
const MAX_AMOUNT = 1060503.58;

const API_ENDPOINT = "https://shop.panci.to/api/"; // with "https://" and "/" at the end.

const PAY = {
    "en": "Pay",
    "ru": "Оплатить",
    "ca": "Pagar",
    "nl": "Betalen",
    "de": "Bezahlen",
    "fr": "Payer",
    "es": "Pagar"
}
const PAYMENT_FAILED = {
    "en": "Payment failed",
    "ru": "Оплата не прошла",
    "ca": "Pagament fallit",
    "nl": "Betaling mislukt",
    "de": "Zahlung fehlgeschlagen",
    "fr": "Paiement échoué",
    "es": "Pago fallido"
}
const PAYMENT_CANCELLED = {
    "en": "You canceled the payment",
    "ru": "Вы отменили оплату",
    "ca": "Has cancel·lat el pagament",
    "nl": "U heeft de betaling geannuleerd",
    "de": "Sie haben die Zahlung abgebrochen",
    "fr": "Vous avez annulé le paiement",
    "es": "Ha cancelado el pago"
}
const ADD = {
    "en": "Add",
    "ru": "Добавить",
    "ca": "Afegir",
    "nl": "Toevoegen",
    "de": "Hinzufügen",
    "fr": "Ajouter",
    "es": "Agregar"
}
const DEFAULT_TABS = {
    "ALL": {
        "en": "All",
        "ru": "Все",
        "ca": "Tots",
        "nl": "Allemaal",
        "de": "Alle",
        "fr": "Tous",
        "es": "Todos"
    },
    "LIKED": {
        "en": "Liked",
        "ru": "Понравившиеся",
        "ca": "M'ha agradat",
        "nl": "Leuk gevonden",
        "de": "Gefällt mir",
        "fr": "Aimé",
        "es": "Me gusta"
    },
    "RECOMMENDATIONS": {
        "en": "Recommendations",
        "ru": "Рекомендации",
        "ca": "Recomanacions",
        "nl": "Aanbevelingen",
        "de": "Empfehlungen",
        "fr": "Recommandations",
        "es": "Recomendaciones"
    }
}

// will create HTML code for a good; description..?
function CreateCardHTML(idsweet, name, description, pictureBase64, price, discount, wt, total, like) {
    return `
    <div class="col-6">
    <div class="card mb-3 g-1">
        <div class="row g-0">
            <div class="col-10 justify-content-end">
                <div class="wrapper">
                    <img src="data:image/png;base64, ${pictureBase64}" class="card-img-top" alt="cake picture" data-id="${idsweet}">
                </div>
            </div>
            <div class="col-2">
                <div class="input-group justify-content-end" id="like-${idsweet}">
                    <button type="button" class="like-button btn" data-id="${idsweet}"><i class="fa-solid fa-heart" id="like-button-${idsweet}" style="color: ${like ? LIKED_COLOR : UNLIKED_COLOR}"></i></button>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="col-12">
                <div class="card-body text-center">
                    <h6 class="card-title">${name} (${wt}g)</h6>
                    <h6 class="card-price">₽${discount == 0 ? price : `<s>${price}</s>${price - price * discount} (-${discount * 100}%)`}</h6>
                    <h5 id="total-${idsweet}" style="display: none;">total</h5>

                    <div class="row">
                        <div class="d-grid gap-2 col-12 mx-auto">
                            <button type="button" class="btn btn-tg" data-id="${idsweet}">${ADD[USERLANGCODE] || ADD[DEFAULT_LANGCODE]}</button>
                            <div class="input-group" id="q-${idsweet}"
                                style="display: none">
                                <button type="button" class="btn btn-dec btn-warning"
                                    data-id="${idsweet}">-</button>
                                <input type="number" readonly min="0" max="${total}" class="form-control-plaintext text-center"
                                    placeholder="Quantity" id="${idsweet}">
                                <button type="button" class="btn btn-inc btn-success"
                                    data-id="${idsweet}">+</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    </div>
</div>
    `;
}

// will update HTML code for goods (after changing a category)
function UpdateCards() {
    var htmlString = "";
    GOODS.forEach(d => {
        htmlString += CreateCardHTML(d.idsweet, d.name, d.description, d.picture_base64, d.cost, d.discount, d.wt, d.max, d.like);
    });
    $("#sweets").html(htmlString);
}

// creating HTML code for categories 
function CreateCategoryHTML(idcategory, name, checked = false) {
    return `
        <li class="nav-item" data-id="${idcategory}"> 
            <button class="nav-link ${checked ? "active" : ""}" data-bs-toggle="tab" aria-selected="${checked}" role="tab" tabindex="-1">${name}</button>
        </li>
    `;
}
// deafult categories
function CreateCategories(categoriesList) {
    $("#categories").append(CreateCategoryHTML('all', DEFAULT_TABS["ALL"][USERLANGCODE] || DEFAULT_TABS["ALL"][DEFAULT_LANGCODE], true));
    $("#categories").append(CreateCategoryHTML('liked', DEFAULT_TABS["LIKED"][USERLANGCODE] || DEFAULT_TABS["LIKED"][DEFAULT_LANGCODE]));
    $("#categories").append(CreateCategoryHTML('popular', DEFAULT_TABS["RECOMMENDATIONS"][USERLANGCODE] || DEFAULT_TABS["RECOMMENDATIONS"][DEFAULT_LANGCODE]));
    categoriesList.forEach(c => {
        htmlString = CreateCategoryHTML(c.idcategory, c.name);
        $("#categories").append(htmlString);
    });
}

// Add the same good again
function Increment() {
    const id = $(this).attr('data-id');
    if (cart[id] < $(`#${id}`).attr('max')) {
        const newVal = UpdateCart(id, 1);
        $("#" + id).val(newVal);
    }

    window.navigator.vibrate(10);
    UpdateMainButton();
}

// Remove one
function Decrement() {
    const id = $(this).attr('data-id');
    const newVal = UpdateCart(id, -1);
    $("#" + id).val(newVal);

    if (newVal == 0) {
        $("#q-" + id).hide();
        $(`.btn-tg[data-id='${id}']`).show();
        $("#total-" + id).hide();
    }

    window.navigator.vibrate(10);
    UpdateMainButton();
}

// Changing tabs
function ChangeTabs() {
    const id = $(this).attr('data-id');

    if (id == "liked" && id != 'popular' && id != 'all') {
        SendGet('sweets', (data) => {
            GOODS = data;
            UpdateCards();
        }, { idcategory: id });
    }
    else if (id == 'all') {
        SendGet('sweets', (data) => {
            GOODS = data;
            UpdateCards();
        });
    }
    else {
        SendGet('sweets', (data) => {
            GOODS = data;
            UpdateCards();
        }, { idcategory: id });
    }

    window.navigator.vibrate(5);
}

// Like/unlike a good
function Like() {
    const id = $(this).attr('data-id');
    const unliked = $(`#like-button-${id}`).css('color') == 'rgb(255, 255, 255)';

    $(`#like-button-${id}`).css('color', unliked ? LIKED_COLOR : UNLIKED_COLOR);
    SendPost('like', () => { }, { idsweet: id });
    window.navigator.vibrate(3);
}

// Update cart array and total price
function UpdateCart(id, count) {
    if (cart[id] != undefined) {
        cart[id] += count;
        if (cart[id] == 0) {
            cart = cart.splice(id, 1);
            return 0;
        }
    }
    else {
        cart[id] = 1;
    }
    var good = GOODS.filter(function (obj) {
        return obj.idsweet === id;
    })[0];

    var price = "₽" + (good["cost"] * cart[id] - (good["cost"] * cart[id] * good["discount"])).toFixed(2);

    $(`#total-${id}`).html(`${price}`);

    return cart[id];
}

// Calculate total price
function SumCart() {
    let sum = 0;
    for (const key in cart) {
        const good = GOODS.find(item => item.idsweet == key);
        sum += (good.cost - good.discount * good.cost) * cart[key];
    }
    return sum;
}

// Update params of the Main button below 
function UpdateMainButton(text = PAY[USERLANGCODE] || PAY[DEFAULT_LANGCODE]) {
    Telegram.WebApp.MainButton.setParams({
        is_visible: SumCart() >= MIN_AMOUNT && SumCart() <= MAX_AMOUNT,
        text: text
    });
}

// If main button clicked ...
async function MainButtonClicked() {
    // forming the cart with goods user chose.
    var user_cart = Array();
    for (const key in cart) {
        user_cart.push({
            idsweet: key,
            count: cart[key]
        });
    }

    // add to a cart and get an invoice.
    SendPost("add_cart", () => {
        SendGet("invoice", (data) => {
            // after opening completing an invoice, Telegram will send back a status message (paid/failed/cancelled)
            Telegram.WebApp.openInvoice(data, (status) => {
                if (status == 'paid') {
                    Telegram.WebApp.close();
                } else if (status == 'failed') {
                    Telegram.WebApp.showAlert(PAYMENT_FAILED[USERLANGCODE] || PAYMENT_FAILED[DEFAULT_LANGCODE]);
                } else {
                    Telegram.WebApp.showAlert(PAYMENT_CANCELLED[USERLANGCODE] || PAYMENT_CANCELLED[DEFAULT_LANGCODE]);
                }
            });
        });
    }, user_cart);

    window.navigator.vibrate(10);
}


/// Sending GET / POST requests
function SendGet(method_name, callback, data = "") {
    $.ajax({
        type: "GET",
        url: API_ENDPOINT + method_name + "?" + window.Telegram.WebApp.initData,
        data: data,
        contentType: "application/json",
        success: callback
    });
}
function SendPost(method_name, callback, data = "") {
    $.ajax({
        type: "POST",
        url: API_ENDPOINT + method_name + "?" + window.Telegram.WebApp.initData,
        data: JSON.stringify(data),
        contentType: "application/json",
        complete: callback
    });
}

// when HTML document is ready, generate HTML code for cards and categories
$(document).ready(function () {
    SendGet("sweets", (data) => {
        GOODS = data;
        UpdateCards();
    });
    SendGet("categories", CreateCategories);
});

$(document).on('click', '.btn-tg', function () {
    const id = $(this).attr('data-id');
    $("#q-" + id).show();
    $("#total-" + id).show();
    $(this).hide();
    const newVal = UpdateCart(id, 1);
    $("#" + id).val(newVal);

    UpdateMainButton();
    window.navigator.vibrate(10);
});

$(document).on('click', '.btn-dec', Decrement); // - button
$(document).on('click', '.btn-inc', Increment); // + button
$(document).on('click', '.nav-item', ChangeTabs); // tabs
$(document).on('click', 'img', Like); // on click for images to like/unlike goods
$(document).on('click', '.like-button', Like); // on click for ❤️ button to like/unlike goods
Telegram.WebApp.MainButton.onClick(MainButtonClicked); // handling pressing on MainButton


