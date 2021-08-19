;(() => {
    document.addEventListener('DOMContentLoaded', () => {
        const bSlider = document.querySelector('.js-banner-slider');

        if (bSlider) {
            const swiper = document.querySelector('.js-banner-slider-swiper');
            const toggle = document.querySelector('.js-banner-slider-toggle');
            const content = document.querySelector('.js-banner-slider-content');

            toggle.addEventListener('click', () => {
                const isActive = !toggle.classList.contains('active');

                toggle.classList[isActive ? 'add' : 'remove']('active');
                content.classList[isActive ? 'add' : 'remove']('active');
                content.style.height = isActive ? content.scrollHeight + 'px' : '0';
            });

            new Swiper(swiper, {
                slidesPerView: 'auto',
                spaceBetween: 40,

                navigation: {
                    prevEl: ".swiper-nav__prev",
                    nextEl: ".swiper-nav__next"
                }
            });
        }
    })
})();
