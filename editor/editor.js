var CATEGORIES = [];
var SWEETS = [];
var SWEETS_CATEGORIES = [];
var USERS = [];

const API_ENDPOINT = "https://shop.panci.to/admin-api/"; // with "https://" and "/" at the end.

// rendering tables
function RenderGoodsTable() {
    $("#sweets-contents").html("");
    SWEETS.forEach((d) => {
        $("#sweets-contents").append(`<tr id="tr-${d.idsweet}">
                <td><span id="name-${d.idsweet}">${d.name}</span></td>
                <td><input id="cost-${d.idsweet}" class="form-control" type="number" step="0.01" value="${d.cost}" required></td>
                <td><input id="discount-${d.idsweet}" class="form-control" type="number" value="${d.discount}" required></td>
                <td><input id="max-${d.idsweet}" class="form-control" type="number" min="0" step="1" value="${d.max}" required></td>
                <td>${d.purchases_total}</td>
            </tr>`);

        CATEGORIES.forEach((category) => {
            $(`#tr-${d.idsweet}`).append(`<td>
                            <input class="form-check-input category-checkbox" type="checkbox" id="${d.idsweet}_${category.idcategory}">
                        </td>`);
        });

        $(`#tr-${d.idsweet}`).append(`<td><button class="btn btn-sweet-change-confirm" data-id="${d.idsweet}"><i class="fa-solid fa-check" style="color: #005eff;"></i></button></td>`);
        $(`#tr-${d.idsweet}`).append(`<td><button class="btn btn-sweet-delete" data-id="${d.idsweet}"><i class="fa-solid fa-trash" style="color: #ff0000;"></i></button></td>`);

        SWEETS_CATEGORIES.forEach((sc) => {
            $(`#${sc.idsweet}_${sc.idcategory}`).prop("checked", true);
        });
    });
}
function RenderCategoriesTable() {
    $("#categories").html("");

    CATEGORIES.forEach(d => {
        $("#categories").append(`
        <div class="form-check">
            <input name="idcategory" class="form-check-input" type="checkbox" value="${d.idcategory}" id="c-${d.idcategory}">
            <label class="form-check-label" for="c-${d.idcategory}">${d.name}</label>
        </div>
        `);
        $("#cols").append(`<th class='col-cat-name'>${d.name}</th>`);
        $("#categories-contents").append(`
        <tr>
            <td><input id="${d.idcategory}-category-name" type="text" class="form-control" value="${d.name}"></td>
            <td><textarea id="${d.idcategory}-category-description" class="form-control" rows=1 cols=200>${d.description}</textarea></td>
            <td><button class="btn btn-category-change-confirm" data-id="${d.idcategory}"><i class="fa-solid fa-check" style="color: #005eff;"></i></button></td>
            <td><button class="btn btn-category-delete" data-id="${d.idcategory}"><i class="fa-solid fa-trash" style="color: #ff0000;"></i></button></td>
        </tr>`);

    });
}
function RenderUsersTable() {
    USERS.forEach(d => {
        $("#users-contents").append(`
        <tr>
            <td>${d.fullname}</td>
            <td>${d.username == null ? "none" : `<a href="https://t.me/${d.username}" target="_blank">@${d.username}</a>`}</td>
            <td><input type="number" id="discount-${d.iduser}" value="${d.personal_discount}" min="0" max="0.99" step="0.01" class="form-control"></td>
            <td><button class="btn btn-discount-change-confirm" data-id="${d.iduser}"><i class="fa-solid fa-check" style="color: #005eff;"></i></button></td>
        </tr>
        `);
    });
}

// when document is ready, sends GET requests and renders goods, categories tables 
$(document).ready(function () {
    SendGet("sweets", (data) => {
        SWEETS = data;

        SendGet("getsweetscategories", (data) => {
            SWEETS_CATEGORIES = data;

            SendGet("getcategories", (data) => {
                CATEGORIES = data;
                RenderGoodsTable();
                RenderCategoriesTable();
            });
        });

    });

    SendGet("getusers", (data) => {
        USERS = data;

        RenderUsersTable();
    });
});

$("#addsweet").submit(function (e) {
    e.preventDefault();

    var categories = $("#categories input:checkbox:checked").map(function () {
        return $(this).val();
    }).get();

    const formData = {
        name: $("#sweet_name").val(),
        cost: $("#sweet_cost").val(),
        discount: $("#sweet_discount").val(),
        quantity: $("#sweet_quantity").val(),
        wt: $("#sweet_wt").val(),
        picture_base64: "",
        categories: categories
    };

    const fileInput = document.getElementById('sweet_picture');
    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = function (event) {
        const result = event.target.result.split(',')[1];
        //$("#sweet_picture_base64").val(result);
        formData.picture_base64 = result;

        SendPost("addsweet", formData);
        // $.ajax({
        //     type: "POST",
        //     url: "https://test.pancito.ru/admin-api/addsweet" + secure_string,
        //     data: JSON.stringify(formData),
        //     contentType: "application/json",
        //     success: function (response) {
        //         console.log(response);
        //     }
        // });
    };
    reader.readAsDataURL(file);


});

$("#addcategory").submit(function (e) {
    e.preventDefault();

    const formData = {
        name: $("#category_name").val(),
        description: $("#category_description").val()
    };


    SendPost("createcategory", formData);
    $(this).trigger("reset");
});

function SweetConfirmChanges() {
    const id = $(this).attr('data-id');
    const updatedInfo = {
        idsweet: id,
        cost: $(`#cost-${id}`).val(),
        discount: $(`#discount-${id}`).val(),
        quantity: $(`#max-${id}`).val()
    };

    SendPost("updatesweet", updatedInfo);
    // $.ajax({
    //     type: "POST",
    //     url: "https://test.pancito.ru/admin-api/updatesweet" + secure_string,
    //     data: JSON.stringify(updateData),
    //     contentType: "application/json",
    //     success: function (response) {
    //         console.log(response);
    //     }
    // });
}
function CategoryConfirmChanges() {
    const id = $(this).attr('data-id');

    const updatedInfo = {
        id: id,
        name: $(`#${id}-category-name`).val(),
        description: $(`#${id}-category-description`).val()
    };

    SendPost("updatecategory", updatedInfo);
    // $.ajax({
    //     type: "POST",
    //     url: "https://test.pancito.ru/admin-api/updatecategory" + secure_string,
    //     data: JSON.stringify(updateData),
    //     contentType: "application/json",
    //     success: function (response) {
    //         console.log(response);
    //     }
    // });
}
function SweetDelete() {
    const idSweetToDelete = $(this).attr('data-id');

    Telegram.WebApp.showConfirm(`Are you sure you want to delete "${$(`#name-${idSweetToDelete}`).html()}"?`,
        (confirmed) => {
            if (confirmed) {
                console.log(confirmed);
                SendPost("deletesweet", { idsweet: idSweetToDelete });
            }
        }
    );

    const indexToDelete = SWEETS.findIndex(function (element) {
        return element.idsweet === idSweetToDelete;
    });

    if (indexToDelete !== -1) {
        SWEETS.splice(indexToDelete, 1);
    }

    RenderGoodsTable();
}
function CategoryDelete() {
    const idCategoryToDelete = $(this).attr('data-id');

    Telegram.WebApp.showConfirm("Are you sure you want to delete the category?",
        (confirmed) => {
            console.log(confirmed);
            if (confirmed) {
                console.log(confirmed);
                SendPost("deletecategory", { id: idCategoryToDelete });
            }
        }
    );

    const indexToDelete = SWEETS.findIndex(function (element) {
        return element.idsweet === idCategoryToDelete;
    });

    if (indexToDelete !== -1) {
        CATEGORIES.splice(indexToDelete, 1);
    }
    RenderCategoriesTable();
}
function UpdateCategory() {
    var ischecked = $(this).is(':checked');
    console.log(`${this.id} - ${ischecked}`);
    const action = ischecked ? "sw_category_add" : "sw_category_remove";

    const parts = this.id.split('_');
    const data = {
        idsweet: parts[0],
        idcategory: parts[1]
    };

    SendPost(action, data);
    // $.ajax({
    //     type: "POST",
    //     url: "https://test.pancito.ru/admin-api/" + action + secure_string,
    //     data: JSON.stringify(data),
    //     contentType: "application/json",
    //     success: function (response) {
    //         console.log(response);
    //     }
    // });
}
function ChangeDiscount() {
    const id = $(this).attr('data-id');
    const data = {
        iduser: id,
        discount: $(`#discount-${id}`).val()
    }

    SendPost("updatediscount", data);
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

$(document).on('click', '.btn-sweet-change-confirm', SweetConfirmChanges);
$(document).on('click', '.btn-category-change-confirm', CategoryConfirmChanges);
$(document).on('click', '.btn-discount-change-confirm', ChangeDiscount);
$(document).on('click', '.btn-sweet-delete', SweetDelete);
$(document).on('click', '.btn-category-delete', CategoryDelete);
$(document).on('change', '.category-checkbox', UpdateCategory);