;(function () {
    document.addEventListener('DOMContentLoaded', () => {
        const swiperContents = document.querySelectorAll('.js-back-slider');
        window.backSlider = []

        if (swiperContents.length) {
            for (const swiperContent of swiperContents) {
                const prev = document.querySelector('.js-back-slider-controls .prev');
                const next = document.querySelector('.js-back-slider-controls .next');

                const swiper = swiperContent.querySelector('.js-back-slider-swiper');

                if (swiper) {
                    const id = Math.random() * Date.now();

                    swiperContent.setAttribute('global-id', id);

                    window.backSlider = [...window.backSlider, {
                        swiper: new Swiper(swiper, {
                            slidesPerView: "auto",
                            autoplay: {
                                delay: 3000,
                            },
                            loop: true,
                            navigation: {
                                prevEl: prev,
                                nextEl: next,
                            }
                        }), id
                    }]
                }
            }
        }
    })
})();
