'use strict';

var page = page || {};

page.body = document.body;
page.header = document.querySelector('.header');
page.burger = document.querySelector('[data-menu-toggle]');
page.mobMenu = document.querySelector('[data-mob-menu]');
page.cartToggle = document.querySelector('[data-cart-popup-toggle]');
page.cartClose = document.querySelector('[data-cart-popup-close]');
page.cartWrapper = document.querySelector('[data-cart-popup-wrapper]');

//Lazyload page
document.addEventListener('DOMContentLoaded', function () {
    setTimeout(function () {
        page.body.style.opacity = '1';
    }, 200);
});

//Mob Nav Actions
page.burger.addEventListener('click', function () {
    page.mobMenu.classList.toggle('open');

    page.burger.querySelectorAll('span').forEach(function (icon) {
        icon.classList.toggle('d-none');
    });
});

// Slide Cart
(function () {
    var cartSubtotal = document.querySelector('[data-cart-subtotal]');
    var cartEmpty = document.querySelector('[data-cart-empty]');

    page.cartToggle.addEventListener('click', function (e) {
        e.preventDefault();
        page.cartWrapper.classList.toggle('cart-popup-wrapper--hidden');
    });
    page.cartClose.addEventListener('click', function (e) {
        e.preventDefault();
        page.cartWrapper.classList.add('cart-popup-wrapper--hidden');
    });
    if (window.location.href.includes('#open-cart')) page.cartWrapper.classList.toggle('cart-popup-wrapper--hidden');

    function initQtyBtns() {
        var qtyBtns = document.querySelectorAll('[data-qty]');

        if (qtyBtns === null) return;

        qtyBtns.forEach(function (btn) {
            btn.addEventListener('click', function () {
                var inputQty = btn.parentElement.querySelector('input');

                if (btn.dataset.qty === '-') {
                    if (inputQty.value === inputQty.getAttribute('min')) return;
                    inputQty.value -= 1;
                } else if (btn.dataset.qty === '+') {
                    inputQty.value = parseInt(inputQty.value) + 1;
                }

                var lineItemIndex = btn.closest('[data-cart-item-index]').dataset.cartItemIndex;
                updateCart(lineItemIndex, inputQty.value);
            });
        });
    }
    window.initQtyBtns = initQtyBtns;

    function updateCart(lineString) {
        var qty = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

        fetch('/cart/change.js', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json;'
            },
            body: JSON.stringify({
                line: lineString,
                quantity: qty
            })
        }).then(function (response) {
            return response.json();
        }).then(function (state) {
            reRenderCart(state);
        });
    }

    function removeItem(btn) {
        var parent = btn.closest('[data-cart-item]');
        parent.classList.add('cart-popup-item__remove-anim');

        setTimeout(function () {
            parent.remove();
        }, 800);
    }

    function BoldCartFix(cart) {
        return BOLD.common.cartDoctor.fix(cart);
    }
    window.BoldCartFix = BoldCartFix;

    function formatMoney(money) {
        return window.BOLD.common.Shopify.formatMoney(money);
    }
    window.formatMoney = formatMoney;

    function reRenderCart(state) {
        var state_old = state;
        var cartItems = document.querySelectorAll('[data-cart-item]');

        state = window.BoldCartFix(state);
        cartSubtotal.textContent = window.BOLD.common.Shopify.formatMoney(state.items_subtotal_price);
        BOLD.common.eventEmitter.emit('BOLD_COMMON_cart_loaded', state);

        cartItems.forEach(function (item, index) {
            var priceWithoutSubscription = item.querySelector('[data-without-subscription]');

            var salePrice = '';
            state_old.items[index].final_line_price > state.items[index].final_line_price ? salePrice = window.formatMoney(state_old.items[index].final_line_price) : salePrice = '';

            if (salePrice !== '') priceWithoutSubscription.textContent = salePrice;
        });

        state.item_count === 0 ? cartEmpty.classList.remove('d-none') : cartEmpty.classList.add('d-none');
    }

    function initRemoveLineItemBtns() {
        var btns = document.querySelectorAll('[data-cart-remove]');

        if (btns === null) return;

        btns.forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.preventDefault();

                var lineString = btn.getAttribute('href');
                lineString = lineString.split('?')[1];
                lineString = lineString.split('&')[0];
                lineString = parseInt(lineString.replace('line=', ''));

                updateCart(lineString);

                removeItem(btn);
            });
        });
    }
    window.initRemoveLine = initRemoveLineItemBtns;
    initQtyBtns();
    initRemoveLineItemBtns();
})();

//* Sections
//> Page Hero
var scrollBtn = document.querySelector('[data-scroll-down]');
if (scrollBtn !== null) {
    scrollBtn.addEventListener('click', function (e) {
        var scrollHeight = e.target.closest('section').offsetHeight;

        // Checking for additional offset created by header
        var announcementBar = page.header.querySelector('.header__bar');
        if (announcementBar) {
            scrollHeight += announcementBar.offsetHeight;
        }

        document.documentElement.scrollTop = scrollHeight; // For Chrome, Firefox, IE and Opera
        document.body.scrollTop = scrollHeight; // For Safari
    });
};

//> Accordions
document.querySelectorAll('[data-accordion]').forEach(function (accordion) {
    accordion.addEventListener('click', function () {
        accordion.classList.toggle('active');
        var panel = accordion.nextElementSibling;
        panel.style.maxHeight ? panel.style.maxHeight = null : panel.style.maxHeight = panel.scrollHeight + "px";
    });
});

//> Product Template - Read More
(function () {
    var readMoreBtn = document.querySelector('[data-read-more]');
    if (readMoreBtn === null) return;

    var readMoreParent = readMoreBtn.parentElement;
    readMoreBtn.addEventListener('click', function (e) {
        e.preventDefault();
        readMoreParent.classList.toggle('open');
        readMoreBtn.classList.add('d-none');
    });
})();

//> Product Template - Variants
(function () {
    var variantInputs = document.querySelectorAll('[data-variant-change]');
    var grantSelect = document.querySelector('#SingleOptionSelector-0');
    if (variantInputs === null) return;

    variantInputs.forEach(function (input) {
        input.addEventListener('change', function () {
            grantSelect.value = input.value;
            grantSelect.dispatchEvent(new CustomEvent('change'));
        });
    });
})();

//> Product Template - Mob Gallery Swipe
(function () {
    var galleryImages = document.querySelectorAll('.product-single__media-wrapper');
    if (galleryImages === null) return;

    var xDown = null;
    var yDown = null;

    function getTouches(evt) {
        return evt.touches || // browser API
        evt.originalEvent.touches; // jQuery
    }

    function handleTouchStart(evt) {
        var firstTouch = getTouches(evt)[0];
        xDown = firstTouch.clientX;
        yDown = firstTouch.clientY;
    }

    function handleTouchMove(evt) {
        if (!xDown || !yDown) {
            return;
        }

        var xUp = evt.touches[0].clientX;
        var yUp = evt.touches[0].clientY;

        var xDiff = xDown - xUp;
        var yDiff = yDown - yUp;

        if (Math.abs(xDiff) > Math.abs(yDiff)) {
            /*most significant*/
            if (xDiff > 0) {
                galleryChangeSlide('Left', evt);
            } else {
                galleryChangeSlide('Right', evt);
            }
        }
        /* reset values */
        xDown = null;
        yDown = null;
    }

    function galleryChangeSlide(dir, e) {
        var parent = e.target.closest('[data-media-id]');
        if (dir === 'Left') {
            var nextElement = parent.nextElementSibling;
            if (nextElement.hasAttribute('data-thumbnail-slider')) return;

            var selector = document.querySelector('[data-thumbnail-id="' + nextElement.dataset.mediaId + '"]');
            selector.click();
        } else if (dir === 'Right') {
            var prevElement = parent.previousElementSibling;
            if (prevElement === null) return;

            var _selector = document.querySelector('[data-thumbnail-id="' + prevElement.dataset.mediaId + '"]');
            _selector.click();
        }
    }

    galleryImages.forEach(function (img) {
        img.addEventListener('touchstart', handleTouchStart, false);
        img.addEventListener('touchmove', handleTouchMove, false);
    });
})();