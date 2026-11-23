const API_URL = "https://dummyjson.com/products";

const DEMO_PRODUCT_ID = 1;
const FAKE_DELAY = 1500;

function wait(ms) {
    return new Promise(function(resolve) {
        setTimeout(resolve, ms);
    });
}

let products = JSON.parse(sessionStorage.getItem("products")) || [];

const params = new URLSearchParams(window.location.search);
const productId = Number(params.get("id"));

const productContainer = document.querySelector("#productContainer");
const loadingMessage = document.querySelector("#loadingMessage");
const errorMessage = document.querySelector("#errorMessage");

let product = products.find(function(item) {
    return item.id === productId;
});

function saveProducts() {
    sessionStorage.setItem("products", JSON.stringify(products));
}

function showLoading(text) {
    setLoading(text !== "", "detail-loader");
    loadingMessage.textContent = text;
    loadingMessage.hidden = text === "";
    productContainer.setAttribute("aria-busy", String(text !== ""));
}

function showError(text) {
    errorMessage.textContent = text;
}

function showActionMessage(elementId, text) {
    const message = productContainer.querySelector("#" + elementId);

    if (message) {
        message.textContent = text;
    }
}

function renderProduct() {
    productContainer.innerHTML = "";

    if (!product) {
        showError("Product not found.");
        return;
    }

    showError("");

    productContainer.innerHTML = `
        <div class="product-image-container">
            <img class="product-image" alt="">
        </div>

        <div class="product-info">

            <p class="product-category"></p>

            <h2 class="product-title" tabindex="-1"></h2>

            <p class="product-description"></p>

            <p class="product-price"></p>

            <p class="product-rating"></p>

            <p class="product-stock"></p>

            <div class="product-actions">

                <button type="button" id="addToCartButton" class="primary-button">
                    Add to cart
                </button>

                <p id="cartMessage" class="action-message"
                   role="status" aria-live="polite"></p>

                <button type="button" id="addToFavoriteButton" class="secondary-button"
                        aria-pressed="false">
                    Add to favorites
                </button>

                <p id="favoriteMessage" class="action-message"
                   role="status" aria-live="polite"></p>

                <button type="button" id="editProductButton" class="secondary-button">
                    Edit product
                </button>

                <p id="editMessage" class="action-message"
                   role="status" aria-live="polite"></p>

            </div>

            <!-- Formulär för att redigera produkten -->
            <form id="editProductForm" class="edit-form" hidden>

                <h3>Edit product</h3>

                <label for="editTitle">Product name</label>
                <input type="text" id="editTitle" required>

                <label for="editPrice">Price</label>
                <input type="number" id="editPrice"
                       min="0" step="0.01" required>

                <label for="editCategory">Category</label>
                <input type="text" id="editCategory" required>

                <label for="editDescription">Description</label>
                <textarea id="editDescription" required></textarea>

                <label for="editStock">Stock</label>
                <input type="number" id="editStock"
                       min="0" step="1" required>

                <div class="edit-form-buttons">

                    <button type="submit" id="saveProductButton">
                        Save changes
                    </button>

                    <button type="button" id="cancelEditButton">
                        Cancel
                    </button>

                </div>

            </form>

            <!-- Ta bort produkt -->
            <div class="delete-section">

                <button id="deleteProductButton" class="delete-button">
                    Delete product
                </button>

                <div id="deleteConfirmation" class="delete-confirmation"
                     role="group" aria-labelledby="deleteConfirmationText" hidden>

                    <p id="deleteConfirmationText">
                        Are you sure you want to delete this product?
                    </p>

                    <button type="button" id="confirmDeleteButton">
                        Confirm delete
                    </button>

                    <button type="button" id="cancelDeleteButton">
                        Cancel
                    </button>

                </div>

                <p id="deleteMessage" class="action-message"
                   role="status" aria-live="polite" tabindex="-1"></p>

            </div>

        </div>
    `;

    const productImage = productContainer.querySelector(".product-image");

    productImage.src = product.thumbnail;
    productImage.alt = product.title;

    productContainer.querySelector(".product-category").textContent =
        "Category: " + product.category;

    productContainer.querySelector(".product-title").textContent =
        product.title;

    productContainer.querySelector(".product-description").textContent =
        product.description;

    productContainer.querySelector(".product-price").textContent =
        "$" + Number(product.price).toFixed(2);

    productContainer.querySelector(".product-rating").textContent =
        "Rating: " +
        (Number(product.rating) > 0
            ? product.rating + " / 5"
            : "Not yet rated");

    productContainer.querySelector(".product-stock").textContent =
        "Stock: " + (product.stock ?? "Not available");

    productContainer.querySelector("#addToCartButton")
        .addEventListener("click", addToCart);

    productContainer.querySelector("#addToFavoriteButton")
        .addEventListener("click", addToFavorites);

    productContainer.querySelector("#editProductButton")
        .addEventListener("click", showEditForm);

    productContainer.querySelector("#deleteProductButton")
        .addEventListener("click", showDeleteConfirmation);

    productContainer.querySelector("#confirmDeleteButton")
        .addEventListener("click", deleteProduct);

    productContainer.querySelector("#cancelDeleteButton")
        .addEventListener("click", hideDeleteConfirmation);

    productContainer.querySelector("#editProductForm")
        .addEventListener("submit", updateProduct);

    productContainer.querySelector("#cancelEditButton")
        .addEventListener("click", hideEditForm);

    updateFavoriteButton();
}

function updateFavoriteButton() {
    const favoriteButton =
        productContainer.querySelector("#addToFavoriteButton");

    if (!favoriteButton) {
        return;
    }

    favoriteButton.setAttribute("aria-pressed", String(product.favorite));

    if (product.favorite) {
        favoriteButton.textContent = "♥ Remove from favorites";
    } else {
        favoriteButton.textContent = "♡ Add to favorites";
    }
}

function addToFavorites() {
    product.favorite = !product.favorite;

    saveProducts();
    updateFavoriteButton();

    if (product.favorite) {
        showActionMessage(
            "favoriteMessage",
            "Product added to favorites!"
        );
    } else {
        showActionMessage(
            "favoriteMessage",
            "Product removed from favorites!"
        );
    }
}

function addToCart() {
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
    updateBagCount();

    showActionMessage("cartMessage", "Product added to cart!");
}
function showEditForm() {
    const editForm = productContainer.querySelector("#editProductForm");

    productContainer.querySelector("#editTitle").value = product.title;
    productContainer.querySelector("#editPrice").value = product.price;
    productContainer.querySelector("#editCategory").value = product.category;
    productContainer.querySelector("#editDescription").value = product.description;
    productContainer.querySelector("#editStock").value = product.stock ?? 0;

    editForm.hidden = false;
    productContainer.querySelector("#editTitle").focus();
}

function hideEditForm() {
    const editForm = productContainer.querySelector("#editProductForm");

    editForm.hidden = true;
    productContainer.querySelector("#editProductButton").focus();
}

async function updateProduct(event) {
    event.preventDefault();

    const updatedData = {
        title: productContainer.querySelector("#editTitle").value.trim(),
        price: Number(productContainer.querySelector("#editPrice").value),
        category: productContainer.querySelector("#editCategory").value.trim(),
        description: productContainer.querySelector("#editDescription").value.trim(),
        stock: Number(productContainer.querySelector("#editStock").value)
    };

    if (
        updatedData.title === "" ||
        updatedData.category === "" ||
        updatedData.description === "" ||
        !Number.isFinite(updatedData.price) ||
        updatedData.price < 0 ||
        !Number.isInteger(updatedData.stock) ||
        updatedData.stock < 0
    ) {
        showActionMessage(
            "editMessage",
            "Please enter valid product information."
        );

        return;
    }

    try {
        showLoading("Updating product...");
        showError("");

        await wait(FAKE_DELAY);

        const response = await fetch(`${API_URL}/${DEMO_PRODUCT_ID}`, {
            method: "PATCH",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(updatedData)
        });

        if (!response.ok) {
            throw new Error(
                "Could not update product. Status: " + response.status
            );
        }

        // Använd svaret från API:et innan den lokala produkten ändras.
        const updatedProduct = await response.json();

        if (!updatedProduct || updatedProduct.id !== DEMO_PRODUCT_ID) {
            throw new Error("The API returned an invalid product response.");
        }

        // Uppdatera den lokala produkten med värdena från API-svaret.
        product.title = updatedProduct.title ?? product.title;
        product.price = Number(updatedProduct.price ?? product.price);
        product.category = updatedProduct.category ?? product.category;
        product.description = updatedProduct.description ?? product.description;
        product.stock = updatedProduct.stock ?? product.stock;

        saveProducts();

        renderProduct();

        // Flytta fokus till produktens rubrik efter att sidan har uppdaterats.
        productContainer.querySelector(".product-title").focus();

        showActionMessage(
            "editMessage",
            "Product updated successfully!"
        );

    } catch (error) {
        showActionMessage("editMessage", error.message);

    } finally {
        showLoading("");
    }
}

function showDeleteConfirmation() {
    const confirmation =
        productContainer.querySelector("#deleteConfirmation");

    confirmation.hidden = false;
    productContainer.querySelector("#confirmDeleteButton").focus();
}

function hideDeleteConfirmation() {
    const confirmation =
        productContainer.querySelector("#deleteConfirmation");

    confirmation.hidden = true;
    productContainer.querySelector("#deleteProductButton").focus();
}

async function deleteProduct() {
    try {
        showLoading("Deleting product...");
        showError("");

        await wait(FAKE_DELAY);

        const response = await fetch(`${API_URL}/${DEMO_PRODUCT_ID}`, {
            method: "DELETE"
        });

        if (!response.ok) {
            throw new Error(
                "Could not delete product. Status: " + response.status
            );
        }

        // Läs och kontrollera API-svaret innan produkten tas bort lokalt.
        const deletedProduct = await response.json();

        if (
            !deletedProduct ||
            deletedProduct.id !== DEMO_PRODUCT_ID ||
            deletedProduct.isDeleted !== true
        ) {
            throw new Error("The API did not confirm that the product was deleted.");
        }

        products = products.filter(function(item) {
            return item.id !== productId;
        });

        saveProducts();

        hideDeleteConfirmation();

        productContainer.querySelector("#deleteProductButton").disabled = true;
        productContainer.querySelector("#addToCartButton").disabled = true;
        productContainer.querySelector("#addToFavoriteButton").disabled = true;
        productContainer.querySelector("#editProductButton").disabled = true;

        showActionMessage(
            "deleteMessage",
            "Product deleted successfully!"
        );

        const editForm = productContainer.querySelector("#editProductForm");

        editForm.hidden = true;

        product = null;
        productContainer.querySelector("#deleteMessage").focus();

    } catch (error) {
        showActionMessage("deleteMessage", error.message);

    } finally {
        showLoading("");
    }
}

renderProduct();
