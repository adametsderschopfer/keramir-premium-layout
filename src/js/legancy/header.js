;(() => {
    document.addEventListener('DOMContentLoaded', () => { 
        const header = document.querySelector('.js-header');

        if (header) {
            let isUp = window.pageYOffset === 0;

            if (!isUp) {
                header.classList.add('active')
            }

            header.addEventListener('mouseover', () => {
                header.classList.add('active')
            });

            header.addEventListener('mouseleave', () => {
                const select = header.querySelector('.js-select');
                select.classList.remove('active');

                if (!isUp) return;
                header.classList.remove('active');
            });

            window.addEventListener('scroll', () => {
                isUp = window.pageYOffset === 0;
                header.classList[isUp ? 'remove' : 'add']('active');
            });
        }
    });
})();
