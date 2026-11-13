let products = JSON.parse(sessionStorage.getItem("products")) || [];

const params = new URLSearchParams(window.location.search);
const productId = Number(params.get("id"));

const productContainer = document.querySelector("#productContainer");
const loadingMessage = document.querySelector("#loadingMessage");
const errorMessage = document.querySelector("#errorMessage");
const deleteProductButton = document.querySelector("#deleteProductButton");
const addToCartButton = document.querySelector("#addToCartButton");
const addToFavoriteButton = document.querySelector("#addToFavoriteButton");
const backButton = document.querySelector("#backButton");

backButton.addEventListener("click", function() {
    window.location.href = "catalog.html";
});

const product = products.find(function(item) {
    return item.id === productId;
});

loadingMessage.textContent = "";

if (product) {

    productContainer.innerHTML = `
        <img src="${product.thumbnail}" alt="${product.title}">

        <h1>${product.title}</h1>

        <p>${product.description}</p>

        <p>Price: $${product.price.toFixed(2)}</p>

        <p>Category: ${product.category}</p>

        <p>Rating: ${product.rating} / 5</p>

        <button id="addToCartButton">
            Add to cart
        </button>

        <button id="addToFavoriteButton">
            Add to favorites
        </button>

        <button id="deleteProductButton">
            Delete product
        </button>
    `;

} else {

    errorMessage.textContent = "Product not found.";

}


deleteProductButton.addEventListener("click", function() {
    const index = products.findIndex(function(item) {
        return item.id === productId;
    });
    if (index !== -1) {
        products.splice(index, 1);
        sessionStorage.setItem("products", JSON.stringify(products));
        window.location.href = "index.html";
    }
});

addToCartButton.addEventListener("click", function() {

    let cart = JSON.parse(sessionStorage.getItem("cart")) || [];

    const existingProduct = cart.find(function(item) {
        return item.id === product.id;
    });

    if (existingProduct) {
        existingProduct.quantity++;
    } else {
        cart.push({
            ...product,
            quantity: 1
        });
    }

    sessionStorage.setItem("cart", JSON.stringify(cart));

    alert("Product added to cart!");

});

addToFavoriteButton.addEventListener("click", function() {

    let favorites = JSON.parse(sessionStorage.getItem("favorites")) || [];

    const alreadyFavorite = favorites.some(function(item) {
        return item.id === product.id;
    });

    if (!alreadyFavorite) {
        favorites.push(product);

        sessionStorage.setItem("favorites", JSON.stringify(favorites));

        alert("Product added to favorites!");
    } else {
        alert("Product is already in favorites!");
    }

});

if (product) {
   
} else {
    errorMessage.textContent = "Product not found.";

    addToCartButton.disabled = true;
    addToFavoriteButton.disabled = true;
    deleteProductButton.disabled = true;
}