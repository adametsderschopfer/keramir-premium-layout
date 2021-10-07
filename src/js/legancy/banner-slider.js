;(() => {
    document.addEventListener('DOMContentLoaded', () => {
        const bSliders = document.querySelectorAll('.js-banner-slider');

        if (bSliders.length) {
            for (const bSlider of bSliders) {
                const swiper = bSlider.querySelector('.js-banner-slider-swiper');
                const bannerSliderBig = bSlider.closest('.js-banner-slider-big');
                const toggle = bSlider.querySelector('.js-banner-slider-toggle');
                const content = bSlider.querySelector('.js-banner-slider-content');

                toggle.addEventListener('click', () => {
                    const isActive = !!toggle.classList.contains('active');

                    bSlider.classList[isActive ? 'add' : 'remove']('active');
                    toggle.classList[isActive ? 'add' : 'remove']('active');
                    content.classList[isActive ? 'add' : 'remove']('active');
                    content.style.height = isActive ? content.scrollHeight + 'px' : '0';
                });

                new Swiper(swiper, {
                    slidesPerView: 'auto',
                    allowTouchMove: false,
                    simulateTouch: false,
                    touchMoveStopPropagation: true,
                    touchStartPreventDefault: false,
                    navigation: {
                        prevEl: ".js-slider-controls .prev",
                        nextEl: ".js-slider-controls .next"
                    },
                    on: {
                        slideChange({slides, realIndex}) {
                            const curr = slides[realIndex];
                            if (curr.dataset.background) {
                                bannerSliderBig.style.backgroundImage = `url(${curr.dataset.background})`;
                            }
                        }
                    },
                    breakpoints: {
                        599: {
                            spaceBetween: 15,
                        }
                    }
                });
            }
        }
    })
})();
