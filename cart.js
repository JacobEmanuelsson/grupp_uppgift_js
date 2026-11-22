const cartList = document.getElementById("cart-list");
const cartCount = document.getElementById("cart-count");
const cartMessage = document.getElementById("cart-message");
const cartSummary = document.getElementById("cart-summary");

let cartItems = [];
let toastTimer;

const toast = document.createElement("p");
toast.className = "toast";
toast.setAttribute("role", "status");
document.body.append(toast);

function saveCart() {
    sessionStorage.setItem("cart", JSON.stringify(cartItems));
    updateBagCount();
}

function isFavorite(id) {
    return readStorage("products", []).some(function (product) {
        return product.id === id && product.favorite === true;
    });
}

function toggleFavorite(id) {
    const products = readStorage("products", []);
    const product = products.find(function (item) {
        return item.id === id;
    });

    if (!product) {
        return;
    }

    product.favorite = !product.favorite;
    sessionStorage.setItem("products", JSON.stringify(products));
}

function showToast(text) {
    toast.textContent = text;
    toast.classList.add("is-visible");

    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
        toast.classList.remove("is-visible");
        toast.textContent = "";
    }, 3000);
}

function getMaxQuantity(item) {
    return Number.isInteger(item.stock) && item.stock > 0 ? item.stock : 99;
}

function createItemElement(item) {
    const li = document.createElement("li");
    li.className = "cart-item";
    li.dataset.id = item.id;

    li.innerHTML = `
        <img class="cart-item-image" alt="">
        <div class="cart-item-info">
            <p class="cart-item-title"><a></a></p>
            <p class="cart-item-category"></p>
            <div class="cart-item-actions">
                <button type="button" class="link-button" data-action="favorite"></button>
                <button type="button" class="link-button" data-action="remove">Remove</button>
            </div>
        </div>
        <div class="quantity-control" role="group">
            <button type="button" data-action="decrease">−</button>
            <span class="quantity-value"></span>
            <button type="button" data-action="increase">+</button>
        </div>
        <p class="cart-item-price"></p>
    `;

    const image = li.querySelector(".cart-item-image");
    image.src = item.thumbnail;
    image.alt = item.title;

    const link = li.querySelector(".cart-item-title a");
    link.href = "detalj.html?id=" + item.id;
    link.textContent = item.title;

    li.querySelector(".cart-item-category").textContent =
        [item.brand, item.category].filter(Boolean).join(" · ");

    const saved = isFavorite(item.id);
    const favoriteButton = li.querySelector('[data-action="favorite"]');
    favoriteButton.textContent = saved ? "♥ Saved to favorites" : "♡ Save for later";
    favoriteButton.setAttribute("aria-pressed", String(saved));

    li.querySelector('[data-action="remove"]')
        .setAttribute("aria-label", "Remove " + item.title + " from bag");

    li.querySelector(".quantity-control")
        .setAttribute("aria-label", "Quantity for " + item.title);

    const decreaseButton = li.querySelector('[data-action="decrease"]');
    decreaseButton.setAttribute("aria-label", "Decrease quantity of " + item.title);
    decreaseButton.disabled = item.quantity <= 1;

    const increaseButton = li.querySelector('[data-action="increase"]');
    increaseButton.setAttribute("aria-label", "Increase quantity of " + item.title);
    increaseButton.disabled = item.quantity >= getMaxQuantity(item);

    li.querySelector(".quantity-value").textContent = item.quantity;
    li.querySelector(".cart-item-price").textContent =
        formatPrice(item.price * item.quantity);

    return li;
}

function render() {
    cartList.innerHTML = "";

    if (cartItems.length === 0) {
        cartCount.textContent = "";
        cartSummary.hidden = true;
        cartMessage.textContent = "Your bag is empty. Explore the collection to find something you love.";
        cartMessage.hidden = false;
        return;
    }

    cartMessage.hidden = true;
    cartSummary.hidden = false;

    let count = 0;
    for (const item of cartItems) {
        count += item.quantity;
        cartList.append(createItemElement(item));
    }

    cartCount.textContent = count + (count === 1 ? " product" : " products") + " selected";

    const totals = calculateTotals(cartItems);
    document.getElementById("subtotal").textContent = formatPrice(totals.subtotal);
    document.getElementById("shipping").textContent =
        totals.shipping === 0 ? "Complimentary" : formatPrice(totals.shipping);
    document.getElementById("total").textContent = formatPrice(totals.total);
}

cartList.addEventListener("click", function (event) {
    const button = event.target.closest("button[data-action]");

    if (!button) {
        return;
    }

    const id = Number(button.closest(".cart-item").dataset.id);
    const item = cartItems.find(function (cartItem) {
        return cartItem.id === id;
    });
    const action = button.dataset.action;

    if (action === "increase" && item.quantity < getMaxQuantity(item)) {
        item.quantity++;
    }

    if (action === "decrease" && item.quantity > 1) {
        item.quantity--;
    }

    if (action === "remove") {
        cartItems = cartItems.filter(function (cartItem) {
            return cartItem.id !== id;
        });
        showToast(item.title + " removed from your bag");
    }

    if (action === "favorite") {
        toggleFavorite(id);
        showToast(isFavorite(id) ? "Saved to favorites" : "Removed from favorites");
    }

    saveCart();
    render();

    if (action !== "remove") {
        const sameButton = cartList.querySelector(
            '[data-id="' + id + '"] [data-action="' + action + '"]'
        );
        if (sameButton) {
            sameButton.focus();
        }
    }
});

cartItems = getCartItems();
saveCart();
render();
