;(() => {
    document.addEventListener('DOMContentLoaded', () => {
        const slider = document.querySelector('.js-companies-slider');

        if (slider) {
            new Swiper(slider, {
                slidesPerView: "auto",
                autoplay: {
                    delay: 2000
                },
                navigation: {
                    prevEl: '.js-companies-slider-prev',
                    nextEl: '.js-companies-slider-next',
                }
            })
        }
    });
})();
