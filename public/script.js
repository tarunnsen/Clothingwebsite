document.addEventListener('DOMContentLoaded', function () {
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const hamburger = document.getElementById('hamburger');

    // Handle mobile menu toggle for both IDs
    function toggleMenu() {
        if (mobileMenu) {
            mobileMenu.classList.toggle('hidden');
        }
    }

    if (mobileMenuButton) {
        mobileMenuButton.addEventListener('click', toggleMenu);
    }

    if (hamburger) {
        hamburger.addEventListener('click', toggleMenu);
    }

    // Close menu on outside click
    document.addEventListener('click', function (event) {
        if (
            !mobileMenu?.contains(event.target) &&
            !mobileMenuButton?.contains(event.target) &&
            !hamburger?.contains(event.target)
        ) {
            mobileMenu?.classList.add('hidden');
        }
    });

    // Quick view buttons
    const quickViewButtons = document.querySelectorAll('.quick-view-button');
    quickViewButtons.forEach(button => {
        button.addEventListener('click', function (e) {
            e.preventDefault();
        });
    });

    // Newsletter
    const newsletterForm = document.querySelector('footer form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const emailInput = this.querySelector('input[type="email"]');
            if (emailInput && emailInput.value) {
                emailInput.value = '';
                alert('Thank you for subscribing!');
            }
        });
    }

    attachCartButtonListeners();
});

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const href = this.getAttribute('href');
        if (href !== '#' && document.querySelector(href)) {
            document.querySelector(href).scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// Update cart logic
function updateCart(action, productId) {
    const url = `/cart/${action}/${productId}?ajax=true`;

    fetch(url)
        .then(res => {
            if (!res.ok) throw new Error('Failed to update cart');
            return res.text();
        })
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            const newCartContent = doc.querySelector('#cartContent');
            const newFooter = doc.querySelector('.border-t.p-4');

            if (newCartContent && newFooter) {
                document.getElementById('cartContent').innerHTML = newCartContent.innerHTML;
                document.querySelector('.border-t.p-4').innerHTML = newFooter.innerHTML;
                attachCartButtonListeners();
            }
        })
        .catch(err => {
            console.error("Cart update error:", err);
            alert("Something went wrong while updating the cart.");
        });
}

// Attach cart button listeners
function attachCartButtonListeners() {
    const buttons = document.querySelectorAll('.cart-btn');
    buttons.forEach(btn => {
        const action = btn.getAttribute('data-action');
        const productId = btn.getAttribute('data-product-id');

        if (action && productId) {
            btn.onclick = () => updateCart(action, productId);
        }
    });
}

// Expose updateCart globally
window.updateCart = updateCart;

// Observe DOM mutations
const observer = new MutationObserver(() => {
    attachCartButtonListeners();
});
observer.observe(document.body, {
    childList: true,
    subtree: true
});
