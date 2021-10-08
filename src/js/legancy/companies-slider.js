;(() => {
    window.addEventListener('load', () => {
        const companies = document.querySelector('.companies');

        if (companies) {
            let items = Array.from(companies.querySelectorAll('.companies__item'));

            if (items) {
                const slider = document.createElement('div');
                slider.classList.add('companies__slider');

                function renderItems() {
                    let els = [];

                    items = items
                        .reduce(function (previousValue, currentValue) {
                        var chunk;
                        if (previousValue.length === 0 || previousValue[previousValue.length - 1].length === 2) {
                            chunk = [];
                            previousValue.push(chunk);
                        }
                        else {
                            chunk = previousValue[previousValue.length - 1];
                        }
                        chunk.push(currentValue);
                        return previousValue;
                    }, []);

                    for (const item of items) {
                        const el = document.createElement('div');
                        el.classList.add('companies__slider-item');
                        el.classList.add('swiper-slide');

                        for (const elItem of item) {
                            el.appendChild(elItem.cloneNode(true));
                        }

                        els.push(el);
                    }

                    return els.map(i => i.outerHTML);
                }

                slider.innerHTML = `
                    <div class="companies__slider-wrapper swiper-wrapper">
                        ${renderItems().join('')}
                    </div>            
                
               `
                companies.appendChild(slider);

                queueMicrotask(() => {
                    new Swiper(slider, {
                        slidesPerView: 'auto',
                    });
                });
            }
        }
    });
})();
