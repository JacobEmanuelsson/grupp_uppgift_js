const order = readStorage("lastOrder", null);
const receiptContent = document.getElementById("receipt-content");
const noOrder = document.getElementById("no-order");

function formatDate(date, withYear) {
    const options = { day: "numeric", month: "long" };

    if (withYear) {
        options.year = "numeric";
    }

    return date.toLocaleDateString("en-GB", options);
}

function addDays(date, days) {
    const copy = new Date(date);
    copy.setDate(copy.getDate() + days);
    return copy;
}

function createReceiptItem(item) {
    const li = document.createElement("li");
    li.className = "receipt-item";

    li.innerHTML = `
        <img alt="">
        <div>
            <p class="receipt-title"></p>
            <p class="meta"></p>
        </div>
        <p class="receipt-price"></p>
    `;

    li.querySelector("img").src = item.thumbnail;
    li.querySelector(".receipt-title").textContent = item.title;
    li.querySelector(".meta").textContent =
        [item.category, "Quantity: " + item.quantity].filter(Boolean).join(" · ");
    li.querySelector(".receipt-price").textContent =
        formatPrice(item.price * item.quantity);

    return li;
}

function renderReceipt() {
    const placed = new Date(order.placedAt);

    document.getElementById("order-meta").textContent =
        "ORDER " + order.number + " · PLACED " + formatDate(placed, true).toUpperCase();

    const list = document.getElementById("receipt-items");
    for (const item of order.items) {
        list.append(createReceiptItem(item));
    }

    document.getElementById("total-paid").textContent = formatPrice(order.total);

    document.getElementById("delivery").textContent =
        "This is a demo order, so no payment was taken. Estimated delivery: " +
        formatDate(addDays(placed, 6), false) + " – " +
        formatDate(addDays(placed, 8), false) + ".";

    receiptContent.hidden = false;
}

if (order && Array.isArray(order.items)) {
    renderReceipt();
} else {
    noOrder.hidden = false;
}