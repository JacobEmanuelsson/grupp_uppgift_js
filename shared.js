const mobileIcon = document.querySelector('.mobile-menu-toggle');
const menuList = document.querySelector('.site-nav');

function setMenuOpen(isOpen) {
    menuList.classList.toggle('active', isOpen);
    mobileIcon.textContent = isOpen ? '\u2715' : '\u2630';
    mobileIcon.setAttribute('aria-expanded', isOpen);
    mobileIcon.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
}

mobileIcon.addEventListener('click', () => {
    setMenuOpen(!menuList.classList.contains('active'));
});

for (const link of menuList.querySelectorAll('a, button')) {
    link.addEventListener('click', () => {
        setMenuOpen(false);
    });
}

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuList.classList.contains('active')) {
        setMenuOpen(false);
        mobileIcon.focus();
    }
});

window.matchMedia('(max-width: 600px)').addEventListener('change', () => {
    setMenuOpen(false);
});

const bagLink = menuList.querySelector('a[href="cart.html"]');
const bagBadge = document.createElement('span');
bagBadge.className = 'bag-count';
bagBadge.setAttribute('aria-hidden', 'true');
bagLink.append(' ', bagBadge);

function updateBagCount() {
    const cart = JSON.parse(sessionStorage.getItem('cart')) || [];

    let count = 0;

    for (const item of cart) {
        count += item.quantity;
    }

    bagBadge.textContent = count;
    bagBadge.hidden = count === 0;
    bagLink.setAttribute('aria-label', `Bag, ${count} ${count === 1 ? 'item' : 'items'}`);
}

window.addEventListener('pageshow', updateBagCount);
updateBagCount();

//Loader

function setLoading(isLoading, loaderId) {
    const loader = document.getElementById(loaderId);

    if (loader) {
        loader.hidden = !isLoading;
    }
}
