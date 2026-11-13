

let favorites = JSON.parse(sessionStorage.getItem("favorites")) || [];


const favoritesContainer = document.querySelector("#favoritesContainer");
const emptyMessage = document.querySelector("#emptyMessage");
const backButton = document.querySelector("#backButton");


function renderFavorites() {

    favoritesContainer.innerHTML = "";

    if (favorites.length === 0) {

        emptyMessage.textContent = "Your favorites list is empty.";

        return;

    }

    emptyMessage.textContent = "";

    favorites.forEach(function(product) {

        const productCard = document.createElement("article");

        productCard.classList.add("favorite-card");

        productCard.innerHTML = `
            <img src="${product.thumbnail}" alt="${product.title}">

            <h3>${product.title}</h3>

            <p>Price: $${product.price.toFixed(2)}</p>

            <a href="detalj.html?id=${product.id}">
                View product
            </a>

            <button class="removeButton">
                Remove favorite
            </button>
        `;

        favoritesContainer.appendChild(productCard);

        const removeButton = productCard.querySelector(".removeButton");

        removeButton.addEventListener("click", function() {
            removeFavorite(product.id);
        });

    });

}


function removeFavorite(productId) {

    favorites = favorites.filter(function(product) {
        return product.id !== productId;
    });

   
    sessionStorage.setItem("favorites", JSON.stringify(favorites));

   
    renderFavorites();

}


backButton.addEventListener("click", function() {
    window.location.href = "catalog.html";
});


renderFavorites();
