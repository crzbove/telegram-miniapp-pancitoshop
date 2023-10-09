const API_ENDPOINT = "https://shop.panci.to/courier-api/"; // with "https://" and "/" at the end.
const STATUSES = {
    1: "🆕",
    2: "🎒",
    3: "🚲",
    4: "⌚",
    5: "✅"
}
const STATUSES_STRING = {
    1: "New order",
    2: "Accepted",
    3: "Going",
    4: "Waiting",
    5: "Completed"
}
function RenderOptions(orderid, statusNow) {
    let htmlString = "";

    Object.keys(STATUSES).forEach(key => {
        const now = statusNow == key;
        htmlString += `
          <option ${now ? "selected" : ""} value="${orderid}_${key}">${STATUSES[key]} ${STATUSES_STRING[key]}</option>
    `;
    });

    return htmlString;
}
function RenderOrders(data) {
    var htmlString = "";
    data.forEach(order => {
        htmlString += `
        <div class="card mb-2 border-info">
            <div class="card-header">
                ${STATUSES[order.status]} ${order.address}
            </div>

            <div class="card-body" style="padding: 0.5rem">
                <h6 class="card-subtitle mb-2 text-muted">${order.status_name}</h6>
                <p class="card-text">${order.items?.replace(/\n/g, ";")}</p>
                <p class="card-text">${order.paid_string}</p>
                <a href="tel: ${order.phone_number}" class="card-link">${order.phone_number}</a>
            </div>

            <div class="card-footer status-update-footer">
                <div class="form-floating">
                    <select class="form-select status-update" id="order-${order.idorder}">
                        ${RenderOptions(order.idorder, order.status)}
                    </select>
                    <label for="order-${order.idorder}">Update order status</label>
                </div>
            </div>
        </div>
        `
    });

    $("#orders").append(htmlString);
}

// when document is ready, sends GET requests and renders goods, categories tables 
$(document).ready(() => {
    SendGet("getavailableorders", (data) => {
        RenderOrders(data);
    });
});

// Send update every time a courier will change a status
$(document).on('change', '.status-update', UpdateStatus);

function UpdateStatus() {
    const newStatusString = $(this).val().split('_');
    const idorder = newStatusString[0];
    const statusnew = newStatusString[1];
    const updateStatusInfo = {
        idorder: idorder,
        statusnew: statusnew
    }

    SendPost("updatestatus", updateStatusInfo, (success) => {
        if (!success) {
            Telegram.WebApp.showAlert("Failed to update the order's status. The difference between the old and new status should not exceed 1.");
        }
    });
}

function SendGet(method_name, callback = null) {
    $.get(API_ENDPOINT + method_name + "?" + window.Telegram.WebApp.initData, null,
        callback,
        "json"
    );
}
function SendPost(method_name, data = "", callback = null) {
    $.ajax({
        type: "POST",
        url: API_ENDPOINT + method_name + "?" + window.Telegram.WebApp.initData,
        data: JSON.stringify(data),
        dataType: "json",
        contentType: "application/json",
        success: callback
    });
}