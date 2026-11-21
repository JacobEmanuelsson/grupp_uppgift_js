const FREE_SHIPPING_LIMIT = 100;
const SHIPPING_COST = 5;

function readStorage(key, fallback) {
    try {
        const value = JSON.parse(sessionStorage.getItem(key));
        return value === null ? fallback : value;
    } catch (error) {
        return fallback;
    }
}

function getCartItems() {
    const cart = readStorage("cart", []);
    const products = readStorage("products", []);
    const items = [];

    for (const item of cart) {
        const latest = products.find(function (product) {
            return product.id === item.id;
        });

        if (latest) {
            items.push({ ...latest, quantity: item.quantity });
        } else if (products.length === 0) {
            items.push(item);
        }
    }

    return items;
}

function formatPrice(amount) {
    return "$" + Number(amount).toFixed(2);
}

function calculateTotals(items) {
    let subtotal = 0;

    for (const item of items) {
        subtotal += item.price * item.quantity;
    }

    subtotal = Math.round(subtotal * 100) / 100;
    const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_LIMIT ? 0 : SHIPPING_COST;

    return { subtotal, shipping, total: subtotal + shipping };
}