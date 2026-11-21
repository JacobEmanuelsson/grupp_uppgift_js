
const PAGE_SIZE = 20;

// Fake waiting time (in milliseconds) before every API call, so the loading messages can be seen
const FAKE_DELAY = 1500;

let products = [];
let currentPage = 1;
let filteredProducts = [];

const productContainer = document.getElementById("product-container")
const searchForm = document.getElementById("search-form");
const minPriceInput = document.getElementById("min-price");
const maxPriceInput = document.getElementById("max-price");
const priceLabel = document.getElementById("price-label");
const priceSlider = document.getElementById("price-slider");
const pageNavigation = document.getElementById("page-navigation");
const favoritesButton = document.getElementById("favorites-button");
const catalogMessage = document.getElementById("catalog-message");

// A promise that resolves after "ms" milliseconds, so "await wait(1000)" pauses for 1 second
function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// Show a message under the products, or hide it if the text is empty
function showCatalogMessage(text) {
    catalogMessage.textContent = text;
    catalogMessage.hidden = text === "";
}

favoritesButton.addEventListener("click", () => {
    window.location.href = "favorites.html";
});

// Add product popup
const addProductButton = document.getElementById("add-product-button");
const addProductDialog = document.getElementById("add-product-dialog");
const cancelAddProductButton = document.getElementById("cancel-add-product");
const addProductForm = document.getElementById("add-product-form");
const addProductMessage = document.getElementById("add-product-message");
const submitAddProductButton = document.getElementById("submit-add-product");

// Show a message inside the popup, or hide it if the text is empty
function showAddProductMessage(text) {
    addProductMessage.textContent = text;
    addProductMessage.hidden = text === "";
}

addProductButton.addEventListener("click", () => {
    showAddProductMessage(""); // clear any old message from last time
    addProductDialog.showModal();
});

cancelAddProductButton.addEventListener("click", () => {
    addProductDialog.close();
});

// Close when clicking the dark area outside the form (that click lands on the dialog itself)
addProductDialog.addEventListener("click", (event) => {
    if (event.target === addProductDialog) {
        addProductDialog.close();
    }
});

addProductForm.addEventListener("submit", addProduct);

async function addProduct(event) {
    event.preventDefault();

    const formData = new FormData(addProductForm);

    // Show loading and disable the buttons so the product can't be added twice
    showAddProductMessage("Adding product...");
    submitAddProductButton.disabled = true;
    cancelAddProductButton.disabled = true;

    const newProduct = await addProductAPI(Object.fromEntries(formData));

    submitAddProductButton.disabled = false;
    cancelAddProductButton.disabled = false;

    // Keep the popup open with the user's input, so they can try again
    if (newProduct === null) {
        showAddProductMessage("Could not add the product. Please try again.");
        return;
    }

    showAddProductMessage("");

    // The API gives every new product the same id, so we make our own.
    // Use the highest existing ID plus one, or 1 if the array is empty.
    const ids = products.map((product) => product.id);
    const newId = Math.max(0, ...ids) + 1;

    products.unshift({
        ...newProduct,
        id: newId,
        price: Number(newProduct.price), // form values are always text
        rating: 0,
        availabilityStatus: "In Stock",
        favorite: false,
        custom: true // marks products added by the user
    });

    saveProducts();
    populateFilter();
    updatePriceSlider();
    applyFilters();

    addProductForm.reset();
    addProductDialog.close();
}

// Send the new product to the API. Returns the product, or null if something went wrong.
async function addProductAPI(product) {
    try {
        await wait(FAKE_DELAY);

        const response = await fetch("https://dummyjson.com/products/add", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(product)
        });

        // fetch only throws on network errors, so a bad status (like 404 or 500) is thrown here
        if (!response.ok) {
            throw new Error(`Status ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Add failed:", error);
        return null;
    }
}

async function init() {
    products = loadProducts();

    // Fetch only when there is no saved catalog.
    // Saved products already contain favorites and our custom products.
    if (products === null) {
        products = [];
        showCatalogMessage("Loading products...");

        // Load all products so filtering and sorting work across every page.
        const apiProducts = await fetchProducts();
        if (apiProducts === null) {
            showCatalogMessage("Could not load products. Please reload the page.");
            return;
        }

        products = apiProducts;
        saveProducts();
    }

    populateFilter();
    if (products.length > 0) {
        createPriceSlider();
    }
    applyFilters();
}

// Save the products array in sessionStorage (it can only store text, so we use JSON)
function saveProducts() {
    sessionStorage.setItem("products", JSON.stringify(products));
}

// Get the products array from sessionStorage, or null if nothing is saved yet
function loadProducts() {
    const savedProducts = sessionStorage.getItem("products");

    // Fetch from the API only when there are no saved products.
    if (savedProducts === null) {
        return null;
    }

    return JSON.parse(savedProducts);
}

// Fetch the full catalog. The page navigation displays 20 products at a time.
// Returns null if something went wrong.
async function fetchProducts() {
    try {
        await wait(FAKE_DELAY);

        const response = await fetch("https://dummyjson.com/products?limit=0");

        // fetch only throws on network errors, so a bad status (like 404 or 500) is thrown here
        if (!response.ok) {
            throw new Error(`Status ${response.status}`);
        }

        const data = await response.json();

        // Give every product a favorite boolean, false from the start
        return data.products.map((product) => ({ ...product, favorite: false }));
    } catch (error) {
        console.error("Fetch failed:", error);
        return null;
    }
}

// Treat new products (rating 0) and missing or invalid scores as unrated.
function getProductRating(product) {
    const rating = Number(product.rating);
    return Number.isFinite(rating) && rating > 0 && rating <= 5 ? rating : null;
}

function renderProducts(productsToRender) {
    productContainer.innerHTML = "";
    document.getElementById("hero-product-count").textContent = `${products.length} PRODUCTS`;

    for (const product of productsToRender) {
        const card = document.createElement("div");
        card.classList.add("product-card");
        card.tabIndex = 0;
        card.setAttribute("role", "link");
        card.setAttribute("aria-label", `View ${product.title}`);
        card.addEventListener("keydown", (event) => {
            if (event.target === card && event.key === "Enter") card.click();
        });

        // innerHTML only builds the empty structure, no product data goes in here
        card.innerHTML = `
            <img class="product-thumbnail">
            <h3 class="product-title"></h3>
            <p class="product-description"></p>
            <p class="product-rating"></p>
            <p class="product-price"></p>
        `;

        // The data is filled in with textContent and properties, so it is always shown as text, never run as HTML
        const thumbnail = card.querySelector(".product-thumbnail");
        thumbnail.src = product.thumbnail;
        thumbnail.alt = product.title;
        thumbnail.loading = "lazy";

        card.querySelector(".product-title").textContent = product.title;
        card.querySelector(".product-description").textContent = product.description;
        const ratingElement = card.querySelector(".product-rating");
        const rating = getProductRating(product);
        if (rating === null) {
            ratingElement.textContent = "Not yet rated";
            ratingElement.classList.add("is-unrated");
        } else {
            const star = document.createElement("span");
            star.classList.add("rating-star");
            star.textContent = "\u2605";
            star.setAttribute("aria-hidden", "true");
            const score = document.createElement("span");
            score.textContent = rating.toFixed(2);
            ratingElement.append(star, score);
            ratingElement.setAttribute("aria-label", `Rated ${rating.toFixed(2)} out of 5`);
        }
        card.querySelector(".product-price").textContent = `$${Number(product.price).toFixed(2)}`;

        // Favorite button: filled heart if favorite, empty heart if not
        const favoriteButton = document.createElement("button");
        favoriteButton.classList.add("favorite-button");
        favoriteButton.type = "button";
        favoriteButton.setAttribute("aria-label", `Save ${product.title} to favorites`);
        favoriteButton.setAttribute("aria-pressed", String(product.favorite));
        favoriteButton.textContent = product.favorite ? "♥" : "♡";

        // Clicking toggles favorite on the product object and updates the heart
        favoriteButton.addEventListener("click", (event) => {
            // Stop the click from also reaching the card (which would open the product page)
            event.stopPropagation();

            product.favorite = !product.favorite;
            favoriteButton.setAttribute("aria-pressed", String(product.favorite));
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

// Rebuild category and availability options when the products change.
function populateFilter() {
    const selectCategory = document.getElementById("filter-category");
    const selectAvailability = document.getElementById("filter-availability");
    const categories = new Set();
    const availabilities = new Set();

    // Remember what the user has selected, so it is kept when the options are rebuilt
    const selects = [selectCategory, selectAvailability];
    const selectedValues = selects.map((select) => select.value);

    for (const product of products) {
        categories.add(product.category)
        availabilities.add(product.availabilityStatus);
    }

    selectCategory.innerHTML = `<option value="">All categories</option>`;

    // Categories can come from the add product form, so they are added with textContent, not innerHTML
    for (const category of categories) {
        const option = document.createElement("option");
        option.value = category;
        option.textContent = category;
        selectCategory.append(option);
    }

    selectAvailability.innerHTML = `<option value="">All products</option>`;

    for (const availability of availabilities) {
        const option = document.createElement("option");
        option.value = availability;
        option.textContent = availability;
        selectAvailability.append(option);
    }

    // Put back the user's selections
    selects.forEach((select, index) => {
        select.value = selectedValues[index];
    });
}

// Find the lowest and highest price so the slider covers all products
function getPriceRange() {
    const prices = products.map((product) => product.price);
    if (prices.length === 0) return { min: 0, max: 1 };

    return {
        min: Math.floor(Math.min(...prices)),
        max: Math.max(Math.floor(Math.min(...prices)) + 1, Math.ceil(Math.max(...prices)))
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

    if (!priceSlider.noUiSlider) {
        createPriceSlider();
        return;
    }
    priceSlider.noUiSlider.updateOptions({
        start: [range.min, range.max],
        range: range
    });
}

// Slice after filtering and sorting so page boundaries stay consistent.
function renderPage() {
    const pageCount = Math.ceil(filteredProducts.length / PAGE_SIZE);
    currentPage = Math.max(1, Math.min(currentPage, pageCount || 1));
    const start = (currentPage - 1) * PAGE_SIZE;
    renderProducts(filteredProducts.slice(start, start + PAGE_SIZE));
    const first = filteredProducts.length ? start + 1 : 0;
    const last = Math.min(start + PAGE_SIZE, filteredProducts.length);
    document.getElementById("product-count").textContent =
        `${first}-${last} of ${filteredProducts.length} products`;
    pageNavigation.replaceChildren();
    pageNavigation.hidden = pageCount <= 1;
    pageNavigation.classList.toggle("is-hidden", pageCount <= 1);

    function addPageButton(text, page, disabled = false) {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = text;
        button.disabled = disabled;
        if (page === currentPage && text === String(page)) {
            button.classList.add("is-current");
            button.setAttribute("aria-current", "page");
        }
        button.setAttribute("aria-label", text === String(page) ? `Page ${page}` : text);
        button.addEventListener("click", () => {
            currentPage = page;
            renderPage();
            document.getElementById("collection").scrollIntoView({ block: "start" });
            pageNavigation.querySelector(".is-current")?.focus({ preventScroll: true });
        });
        pageNavigation.append(button);
    }

    addPageButton("Previous", currentPage - 1, currentPage === 1);
    for (let page = 1; page <= pageCount; page++) addPageButton(String(page), page);
    addPageButton("Next", currentPage + 1, currentPage === pageCount);
}

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

    filteredProducts = products.filter((product) => {
        if (search !== "" && !product.title.toLowerCase().includes(search) && !product.description.toLowerCase().includes(search)) {
            return false;
        }

        if (category !== "" && product.category !== category) {
            return false;
        }

        const productRating = getProductRating(product);
        if (rating !== "" && (productRating === null || productRating < Number(rating))) {
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

    currentPage = 1;
    renderPage();

    // Tell the user when nothing matched, otherwise hide the message
    if (filteredProducts.length === 0) {
        showCatalogMessage("No products match your search.");
    } else {
        showCatalogMessage("");
    }
}

searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    applyFilters();
});

// Rating changes apply immediately and return to the first matching page.
document.getElementById("filter-rating").addEventListener("change", applyFilters);

init()
