;(() => {
    document.addEventListener('DOMContentLoaded', () => {
        const bSliders = document.querySelectorAll('.js-banner-slider');

        if (bSliders.length) {
            for (const bSlider of bSliders) {
                const swiper = bSlider.querySelector('.js-banner-slider-swiper');
                const toggle = bSlider.querySelector('.js-banner-slider-toggle');
                const content = bSlider.querySelector('.js-banner-slider-content');

                toggle.addEventListener('click', () => {
                    const isActive = !!toggle.classList.contains('active');

                    toggle.classList[isActive ? 'add' : 'remove']('active');
                    content.classList[isActive ? 'add' : 'remove']('active');
                    content.style.height = isActive ? content.scrollHeight + 'px' : '0';
                });

                new Swiper(swiper, {
                    slidesPerView: 'auto',
                    navigation: {
                        prevEl: ".js-slider-controls .prev",
                        nextEl: ".js-slider-controls .next"
                    }
                });
            }
        }
    })
})();
