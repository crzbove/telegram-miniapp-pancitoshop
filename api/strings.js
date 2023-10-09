const DEFAULT_LANGCODE = "en"

const WEBAPP_BUTTON_TEXT = {
    "en": "Go to the store",
    "ru": "Переход в магазин",
    "ca": "Anar a la botiga",
    "nl": "Ga naar de winkel",
    "de": "Zum Laden gehen",
    "fr": "Aller au magasin",
    "es": "Ir a la tienda"
};

// https://vercel.com/docs/projects/environment-variables/system-environment-variables
const MAIN_URL = "shop.panci.to";
const WEBAPP_URL = "https://" + MAIN_URL + "/app";
const WEBAPP_EDITOR_URL = "https://" + MAIN_URL + "/editor";
const WEBAPP_COURIER_URL = "https://" + MAIN_URL + "/courier";
const BOT_WEBHOOK_URL = "https://" + MAIN_URL + "/bot";

// for inline results when a courier will try to take an order
const ORDER_STATUSES = {
    1: { PIC: "https://em-content.zobj.net/thumbs/120/microsoft/319/new-button_1f195.png", TEXT: "", FRIENDLY_MESSAGE_FOR_USER: "" },
    2: { PIC: "https://em-content.zobj.net/thumbs/120/microsoft/319/backpack_1f392.png", TEXT: "🎒 Accepted", FRIENDLY_MESSAGE_FOR_USER: "The courier has accepted your order 🎒" },
    3: { PIC: "https://em-content.zobj.net/thumbs/120/microsoft/319/delivery-truck_1f69a.png", TEXT: "🚲 Going", FRIENDLY_MESSAGE_FOR_USER: "The courier is on the way 🚲" },
    4: { PIC: "https://em-content.zobj.net/thumbs/120/microsoft/319/watch_231a.png", TEXT: "⌚ Waiting", FRIENDLY_MESSAGE_FOR_USER: "The courier is waiting for you ⌚" },
    5: { PIC: "https://em-content.zobj.net/thumbs/120/microsoft/319/check-mark-button_2705.png", TEXT: "✅ Completed", FRIENDLY_MESSAGE_FOR_USER: "The order is completed ✅\nThank you for your order! 😊 You can leave /feedback, it'll help us to improve our services." }
};

const HELLO_TEXT = {
    "en": "Hello! Welcome to our store!",
    "ru": "Привет! Добро пожаловать в наш магазин!",
    "ca": "Hola! Benvingut/da a la nostra botiga!",
    "nl": "Hallo! Welkom in onze winkel!",
    "de": "Hallo! Willkommen in unserem Geschäft!",
    "fr": "Bonjour! Bienvenue dans notre magasin!",
    "es": "¡Hola! Bienvenido/a a nuestra tienda!"
};

const ERROR_TEXT = {
    "en": "Unfortunately we couldn't create the order 😞",
    "ru": "К сожалению, не получилось создать заказ 😞. Скорее всего один из добавленных товаров заканчивается.\nПопробуйте уменьшить количество товаров в корзине.",
    "ca": "Lamentablement, no s'ha pogut crear la comanda 😞. És probable que un dels productes afegits s'hagi esgotat.\nProveu de reduir la quantitat de productes a la cistella.",
    "nl": "Helaas is het niet gelukt om een bestelling te maken 😞. Waarschijnlijk is een van de toegevoegde producten uitverkocht.\nProbeer het aantal producten in uw winkelmandje te verminderen.",
    "de": "Leider konnte die Bestellung nicht erstellt werden 😞. Wahrscheinlich ist eines der hinzugefügten Produkte ausverkauft.\nVersuchen Sie, die Anzahl der Produkte im Warenkorb zu reduzieren.",
    "fr": "Malheureusement, la commande n'a pas pu être créée 😞. Il est probable qu'un des produits ajoutés soit épuisé.\nEssayez de réduire la quantité de produits dans votre panier.",
    "es": "Lamentablemente, no se pudo crear el pedido 😞. Es probable que uno de los productos agregados esté agotado.\nIntente reducir la cantidad de productos en su carrito."
};

const NO_GOODS_TO_RATE_TEXT = {
    "en": "No goods available for rating at the moment. Please come back later 😊",
    "ru": "Пока нет товаров, которые можно было бы оценить. Возвращайтесь позже 😊",
    "ca": "De moment no hi ha productes per avaluar. Torneu més tard 😊",
    "nl": "Er zijn op dit moment geen goederen om te beoordelen. Kom later terug 😊",
    "de": "Es gibt derzeit keine Waren zu bewerten. Kommen Sie später wieder 😊",
    "fr": "Il n'y a actuellement aucun produit à évaluer. Revenez plus tard 😊",
    "es": "Por el momento no hay productos para calificar. Vuelve más tarde 😊"
};

const STATUS_UPDATED = {
    "en": "Status updated",
    "ru": "Статус обновлён",
    "ca": "Estat actualitzat",
    "nl": "Status bijgewerkt",
    "de": "Status aktualisiert",
    "fr": "Statut mis à jour",
    "es": "Estado actualizado"
};

const STATUS_UPDATED_ERROR = {
    "en": "Error updating status",
    "ru": "Ошибка при обновлении статуса",
    "ca": "Error en l'actualització de l'estat",
    "nl": "Fout bij bijwerken van de status",
    "de": "Fehler bei der Aktualisierung des Status",
    "fr": "Erreur lors de la mise à jour du statut",
    "es": "Error al actualizar el estado"
};

const INVOICE_TITLE = {
    "en": "Purchase Payment",
    "ru": "Оплата покупок",
    "ca": "Pagament de compres",
    "nl": "Betaling voor aankopen",
    "de": "Zahlung für Einkäufe",
    "fr": "Paiement des achats",
    "es": "Pago de compras"
};

const INVOICE_DESCRIPTION = {
    "en": "Use card 4242 4242 4242 4242 to check payments.\nExpiration date - any future date.\nCVV - any 3 digits.",
    "ru": "Для проверки платежей используйте карту 4242 4242 4242 4242.\nСрок действия - любая дата в будущем.\nCVV - любые 3 цифры.",
    "ca": "Per verificar els pagaments, utilitzeu la targeta 4242 4242 4242 4242.\nTermini de validesa: qualsevol data futura.\nCVV: qualsevol combinació de 3 xifres.",
    "nl": "Gebruik kaart 4242 4242 4242 4242 om betalingen te controleren.\nGeldigheidsduur - elke toekomstige datum.\nCVV - elke 3 cijfers.",
    "de": "Verwenden Sie die Karte 4242 4242 4242 4242, um Zahlungen zu überprüfen.\nGültigkeitsdauer - jedes zukünftige Datum.\nCVV - jede 3-stellige Zahl.",
    "fr": "Utilisez la carte 4242 4242 4242 4242 pour vérifier les paiements.\nDate d'expiration - toute date future.\nCVV - n'importe quel code à 3 chiffres.",
    "es": "Para verificar los pagos, utilice la tarjeta 4242 4242 4242 4242.\nFecha de caducidad: cualquier fecha futura.\nCVV: cualquier combinación de 3 dígitos."
};

const THANKYOU_FEEDBACK = {
    "en": "Thank you for providing your feedback 🙏",
    "ru": "Спасибо за Ваш отзыв 🙏",
    "ca": "Gràcies per donar la vostra opinió 🙏",
    "nl": "Bedankt voor het geven van uw feedback 🙏",
    "de": "Vielen Dank für Ihr Feedback 🙏",
    "fr": "Merci pour votre retour 🙏",
    "es": "Gracias por proporcionar su opinión 🙏"
}

// URL for a picture in an invoice
const INVOICE_PIC_URL = "https://em-content.zobj.net/source/microsoft/319/shopping-cart_1f6d2.png";
const NEW_ORDER_NOTIFICATION_TEXT = "Поступил новый заказ";

const SUCCESSFUL_PAYMENT_TEXT = {
    "en": "We have received your payment! Thank you! A courier will contact you shortly!",
    "ru": "Получили Ваш платёж! Спасибо! Курьер скоро свяжется с вами!",
    "ca": "Hem rebut el seu pagament! Gràcies! En breu es posarà en contacte amb vostè un repartidor!",
    "nl": "We hebben uw betaling ontvangen! Bedankt! Een koerier zal binnenkort contact met u opnemen!",
    "de": "Wir haben Ihre Zahlung erhalten! Vielen Dank! Ein Kurier wird sich in Kürze bei Ihnen melden!",
    "fr": "Nous avons bien reçu votre paiement ! Merci ! Un livreur vous contactera bientôt !",
    "es": "¡Hemos recibido su pago! ¡Gracias! ¡Un mensajero se pondrá en contacto con usted en breve!"
};

// bot will send this sticker to an user after successful payment
const SUCCESSFUL_PAYMENT_STICKER_FILEID = "CAACAgQAAxkBAAIDT2Q4TsozxAksx_KITYrm0bx0W8vPAALPCQACEtbAUD98e-nJN14WLwQ";

module.exports = {
    WEBAPP_BUTTON_TEXT, WEBAPP_URL, ORDER_STATUSES, HELLO_TEXT, ERROR_TEXT,
    NO_GOODS_TO_RATE_TEXT, STATUS_UPDATED, STATUS_UPDATED_ERROR, INVOICE_TITLE, INVOICE_DESCRIPTION,
    SUCCESSFUL_PAYMENT_TEXT,
    INVOICE_PIC_URL, NEW_ORDER_NOTIFICATION_TEXT, SUCCESSFUL_PAYMENT_STICKER_FILEID,
    DEFAULT_LANGCODE, THANKYOU_FEEDBACK,
    WEBAPP_EDITOR_URL, BOT_WEBHOOK_URL, WEBAPP_COURIER_URL
}