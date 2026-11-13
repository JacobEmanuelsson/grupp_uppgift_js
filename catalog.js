
const PAGE_SIZE = 30;

let products = [];
let totalProducts = 0;

const productContainer = document.getElementById("product-container")
const searchForm = document.getElementById("search-form");
const minPriceInput = document.getElementById("min-price");
const maxPriceInput = document.getElementById("max-price");
const priceLabel = document.getElementById("price-label");
const priceSlider = document.getElementById("price-slider");
const moreButton = document.getElementById("more-products");
const favoritesButton = document.getElementById("favorites-button");

favoritesButton.addEventListener("click", () => {
    window.location.href = "favorites.html";
});

async function init() {
    // Use the saved products if they exist, otherwise fetch them from the API
    products = loadProducts();

    if (products === null) {
        products = await fetchProducts(PAGE_SIZE, 0);

        // Only save if the fetch worked, so a failed fetch is tried again on reload
        if (products.length > 0) {
            saveProducts();
        }
    }

    // Nothing to show or filter if the fetch failed
    if (products.length === 0) {
        productContainer.textContent = "Could not load products.";
        moreButton.hidden = true;
        return;
    }

    renderProducts(products);
    populateFilter();
    createPriceSlider();
    updateMoreButton();
}

// Save the products array in sessionStorage (it can only store text, so we use JSON)
// The total is saved too, so we know if there are more products to load after a reload
function saveProducts() {
    sessionStorage.setItem("products", JSON.stringify(products));
    sessionStorage.setItem("totalProducts", totalProducts);
}

// Get the products array from sessionStorage, or null if nothing is saved yet
function loadProducts() {
    const savedProducts = sessionStorage.getItem("products");
    const savedTotal = sessionStorage.getItem("totalProducts");

    // If either is missing, the saved data is incomplete, so fetch from the API instead
    if (savedProducts === null || savedTotal === null) {
        return null;
    }

    totalProducts = Number(savedTotal);
    return JSON.parse(savedProducts);
}

// Fetch "limit" products, starting after the first "skip" products
async function fetchProducts(limit, skip) {
    const response = await fetch(`https://dummyjson.com/products?limit=${limit}&skip=${skip}`);

    if (!response.ok) {
        return [];
    }

    const data = await response.json();

    // How many products the API has in total, used to hide the "See more" button
    totalProducts = data.total;

    // Give every product a favorite boolean, false from the start
    return data.products.map((product) => ({ ...product, favorite: false }));

}

function renderProducts(productsToRender) {
    productContainer.innerHTML = "";

    for (const product of productsToRender) {
        const card = document.createElement("div");
        card.classList.add("product-card");

        card.innerHTML = `
            <img class="product-thumbnail" src="${product.thumbnail}" alt="${product.title}">
            <h3 class="product-title">${product.title}</h3>
            <p class="product-description">${product.description}</p>
            <p class="product-rating">${product.rating}</p>
            <p class="product-price">${product.price}$</p>
        `;

        // Favorite button: filled heart if favorite, empty heart if not
        const favoriteButton = document.createElement("button");
        favoriteButton.classList.add("favorite-button");
        favoriteButton.textContent = product.favorite ? "♥" : "♡";

        // Clicking toggles favorite on the product object and updates the heart
        favoriteButton.addEventListener("click", (event) => {
            // Stop the click from also reaching the card (which would open the product page)
            event.stopPropagation();

            product.favorite = !product.favorite;
            favoriteButton.textContent = product.favorite ? "♥" : "♡";
            saveProducts();
        });

        // Clicking the card opens the product page with the product id in the URL
        card.addEventListener("click", () => {
            window.location.href = `detalj.html?id=${product.id}`;
        });

        card.append(favoriteButton);
        productContainer.append(card);
    }
}

// Fill the dropdowns from the products. Can be run again after more products are loaded.
function populateFilter() {
    const selectCategory = document.getElementById("filter-category");
    const selectRating = document.getElementById("filter-rating");
    const selectAvailability = document.getElementById("filter-availability");
    const selectSort = document.getElementById("sort-product");
    const categories = new Set();
    const availabilities = new Set();

    // Remember what the user has selected, so it is kept when the options are rebuilt
    const selects = [selectCategory, selectRating, selectAvailability, selectSort];
    const selectedValues = selects.map((select) => select.value);

    for (const product of products) {
        categories.add(product.category)
        availabilities.add(product.availabilityStatus);
    }

    selectCategory.innerHTML = `<option value="">All</option>`;

    for (const category of categories) {
        selectCategory.innerHTML += `<option value="${category}">${category}</option>`;
    }

    selectRating.innerHTML = `<option value="">All</option>`;

    for (let rating = 1; rating <= 5; rating++) {
        selectRating.innerHTML += `<option value="${rating}">${rating}+</option>`;
    }

    selectAvailability.innerHTML = `<option value="">All</option>`;

    for (const availability of availabilities) {
        selectAvailability.innerHTML += `<option value="${availability}">${availability}</option>`;
    }

    selectSort.innerHTML = `
        <option value="">Default</option>
        <option value="price-asc">Price ↑</option>
        <option value="price-desc">Price ↓</option>
    `;

    // Put back the user's selections
    selects.forEach((select, index) => {
        select.value = selectedValues[index];
    });
}

// Find the lowest and highest price so the slider covers all products
function getPriceRange() {
    const prices = products.map((product) => product.price);

    return {
        min: Math.floor(Math.min(...prices)),
        max: Math.ceil(Math.max(...prices))
    };
}

// Create the price slider with noUiSlider (loaded in catalog.html). Only run once.
function createPriceSlider() {
    const range = getPriceRange();

    noUiSlider.create(priceSlider, {
        start: [range.min, range.max], // where the two handles start
        connect: true,                 // color the bar between the handles
        step: 1,                       // move in whole numbers
        range: range
    });

    // Runs when the slider is created and every time a handle moves.
    // Copies the values to the hidden inputs (for FormData) and updates the label.
    priceSlider.noUiSlider.on("update", (values) => {
        minPriceInput.value = Math.round(values[0]);
        maxPriceInput.value = Math.round(values[1]);
        priceLabel.textContent = `$${minPriceInput.value} - $${maxPriceInput.value}`;
    });
}

// Update the existing slider to the new price range (noUiSlider.create can't be run twice).
// The handles are moved to the ends so the new products are included.
function updatePriceSlider() {
    const range = getPriceRange();

    priceSlider.noUiSlider.updateOptions({
        start: [range.min, range.max],
        range: range
    });
}

// Hide the "See more" button when all products are loaded
function updateMoreButton() {
    moreButton.hidden = products.length >= totalProducts;
}

moreButton.addEventListener("click", async () => {
    // Disable while loading so a double click doesn't load the same products twice
    moreButton.disabled = true;

    const newProducts = await fetchProducts(PAGE_SIZE, products.length);

    if (newProducts.length > 0) {
        products.push(...newProducts);
        saveProducts();
        populateFilter();
        updatePriceSlider();
        applyFilters();
    }

    moreButton.disabled = false;
    updateMoreButton();
});

// Filter and sort the products with the values from the search form, then show them
function applyFilters() {
    const formData = new FormData(searchForm);
    const search = formData.get("search-product").trim().toLowerCase();
    const category = formData.get("filter-category");
    const rating = formData.get("filter-rating");
    const availability = formData.get("filter-availability");
    const minPrice = formData.get("min-price");
    const maxPrice = formData.get("max-price");
    const sort = formData.get("sort-product");

    const filteredProducts = products.filter((product) => {
        if (search !== "" && !product.title.toLowerCase().includes(search) && !product.description.toLowerCase().includes(search)) {
            return false;
        }

        if (category !== "" && product.category !== category) {
            return false;
        }

        if (rating !== "" && product.rating < Number(rating)) {
            return false;
        }

        if (availability !== "" && product.availabilityStatus !== availability) {
            return false;
        }

        if (minPrice !== "" && product.price < Number(minPrice)) {
            return false;
        }

        if (maxPrice !== "" && product.price > Number(maxPrice)) {
            return false;
        }

        return true;
    });

    if (sort === "price-asc") {
        filteredProducts.sort((a, b) => a.price - b.price);
    } else if (sort === "price-desc") {
        filteredProducts.sort((a, b) => b.price - a.price);
    }

    renderProducts(filteredProducts);
}

searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    applyFilters();
});

init()
