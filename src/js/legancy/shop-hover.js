;(function () {
    window.addEventListener('load', () => {
        const shops = document.querySelector('.shops');

        if (shops) {
            const items = shops.querySelectorAll('.shops__item');
            const itemsImages = shops.querySelectorAll('.shops__item .shops__item-img');

            if (items.length) {
                for (let i = 0; i !== itemsImages.length; i++) {
                    itemsImages[i].addEventListener('mouseover', () => {
                        items.forEach(_i => {
                            if (items[i] === _i) return;

                            _i.classList.add('hide');
                        });
                    });

                    itemsImages[i].addEventListener('mouseleave', () => {
                        items.forEach(i => i.classList.remove('hide'));
                    });
                }
            }
        }
    });
})();
