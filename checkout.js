const orderList = document.getElementById("cart-list");
const checkoutMessage = document.getElementById("cart-message");
const orderSummary = document.getElementById("cart-summary");
const placeOrderButton = document.getElementById("place-order");

let orderItems = [];

function showMessage(text) {
    checkoutMessage.textContent = text;
    checkoutMessage.hidden = text === "";
}

function createOrderItemElement(item) {
    const li = document.createElement("li");
    li.className = "cart-item checkout-item";

    li.innerHTML = `
        <img class="cart-item-image" alt="">
        <div class="cart-item-info">
            <p class="cart-item-title"></p>
            <p class="cart-item-category"></p>
        </div>
        <p class="cart-item-price"></p>
    `;

    const image = li.querySelector(".cart-item-image");
    image.src = item.thumbnail;
    image.alt = item.title;

    li.querySelector(".cart-item-title").textContent = item.title;
    li.querySelector(".cart-item-category").textContent = "Quantity: " + item.quantity;
    li.querySelector(".cart-item-price").textContent =
        formatPrice(item.price * item.quantity);

    return li;
}

function renderCheckout() {
    orderList.innerHTML = "";

    if (orderItems.length === 0) {
        orderSummary.hidden = true;
        showMessage("Your bag is empty, so there is nothing to check out yet.");
        return;
    }

    for (const item of orderItems) {
        orderList.append(createOrderItemElement(item));
    }

    const totals = calculateTotals(orderItems);
    document.getElementById("subtotal").textContent = formatPrice(totals.subtotal);
    document.getElementById("shipping").textContent =
        totals.shipping === 0 ? "Complimentary" : formatPrice(totals.shipping);
    document.getElementById("total").textContent = formatPrice(totals.total);

    orderSummary.hidden = false;
}

function createOrderNumber() {
    const part1 = Math.floor(1000 + Math.random() * 9000);
    const part2 = Math.floor(100 + Math.random() * 900);
    return "SG-" + part1 + "-" + part2;
}

function placeOrder() {
    placeOrderButton.disabled = true;
    placeOrderButton.textContent = "Placing your order...";
    showMessage("Placing your order...");

    setTimeout(function () {
        const totals = calculateTotals(orderItems);

        const order = {
            number: createOrderNumber(),
            placedAt: new Date().toISOString(),
            total: totals.total,
            items: orderItems.map(function (item) {
                return {
                    title: item.title,
                    category: item.category,
                    thumbnail: item.thumbnail,
                    price: item.price,
                    quantity: item.quantity
                };
            })
        };

        sessionStorage.setItem("lastOrder", JSON.stringify(order));
        sessionStorage.removeItem("cart");
        window.location.href = "order-complete.html";
    }, 1500);
}

placeOrderButton.addEventListener("click", placeOrder);

orderItems = getCartItems();
renderCheckout();