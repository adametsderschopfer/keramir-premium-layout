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

            window.bannerSlider = new Swiper(swiper, {
                slidesPerView: 4,
                spaceBetween: 40,
                on: {
                    init({slides}) {
                        if (slides.length) {
                            for (const slide of slides) {
                                slide.addEventListener('click', () => {
                                    const idx = slide.getAttribute('aria-label').split('/')[0].trim();
                                    const wrapper = bSlider.closest('.default-banner');

                                    if (wrapper) {
                                        const backSlider = wrapper.querySelector('.js-back-slider');

                                        if (backSlider && +idx) {
                                            const id = backSlider.getAttribute('global-id');

                                            if (id) {
                                                const _slider = window.backSlider.find(i => i.id.toString() === id.toString())?.swiper;

                                                if (_slider) {
                                                    _slider.slideTo(+idx);
                                                }
                                            }
                                        }
                                    }
                                });
                            }
                        }
                    }
                },
                navigation: {
                    prevEl: ".swiper-nav__prev",
                    nextEl: ".swiper-nav__next"
                }
            });
        }
    })
})();
