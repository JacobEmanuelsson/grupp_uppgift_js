
let products = JSON.parse(sessionStorage.getItem("products")) || [];

const favoritesContainer = document.getElementById("favorites-container");
const favoritesMessage = document.getElementById("favorites-message");
const favoriteCount = document.getElementById("favorite-count");

function saveProducts() {
    sessionStorage.setItem("products", JSON.stringify(products));
}

function showMessage(text) {
    favoritesMessage.textContent = text;
    favoritesMessage.hidden = text === "";
}

function getFavorites() {
    return products.filter(function(product) {
        return product.favorite === true;
    });
}

function renderFavorites() {
    favoritesContainer.innerHTML = "";

    const favoriteProducts = getFavorites();

    favoriteCount.textContent =
        favoriteProducts.length + " products";

    if (favoriteProducts.length === 0) {
        showMessage("Your favorites list is empty. Explore the collection to find something you love.");
        return;
    }

    showMessage("");

    favoriteProducts.forEach(function(product) {

        const card = document.createElement("div");
        card.classList.add("favorite-card");

        card.innerHTML = `
            <img class="favorite-thumbnail" alt="">

            <h3 class="product-title"></h3>

            <p class="product-description"></p>

            <p class="product-price"></p>

            <button class="remove-favorite-button" type="button">
                ♥ Remove from favorites
            </button>
        `;

        const image = card.querySelector(".favorite-thumbnail");

        image.src = product.thumbnail;
        image.alt = product.title;
        image.loading = "lazy";

        card.querySelector(".product-title").textContent =
            product.title;

        card.querySelector(".product-description").textContent =
            product.description;

        card.querySelector(".product-price").textContent =
            "$" + Number(product.price).toFixed(2);

        const removeButton =
            card.querySelector(".remove-favorite-button");

        removeButton.addEventListener("click", function(event) {

            event.stopPropagation();

            product.favorite = false;

            saveProducts();

            renderFavorites();
        });

        card.addEventListener("click", function() {
            window.location.href = `detalj.html?id=${product.id}`;
        });

        card.tabIndex = 0;

        card.setAttribute("role", "link");

        card.setAttribute(
            "aria-label",
            "View " + product.title
        );

        card.addEventListener("keydown", function(event) {
            if (event.target === card && event.key === "Enter") {
                window.location.href = `detalj.html?id=${product.id}`;
            }
        });

        favoritesContainer.append(card);
    });
}


// Starta sidan
renderFavorites();
