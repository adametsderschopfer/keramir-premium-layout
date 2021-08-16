;(() => {
    document.addEventListener('DOMContentLoaded', () => { 
        const header = document.querySelector('.js-header');

        if (header) {
            let isUp = window.pageYOffset === 0;

            header.addEventListener('mouseover', () => {
                header.classList.add('active')
            });

            header.addEventListener('mouseleave', () => {
                if (!isUp) return;
                header.classList.remove('active')
            });

            window.addEventListener('scroll', () => {
                isUp = window.pageYOffset === 0;
                header.classList[isUp ? 'remove' : 'add']('active');
            });
        }
    });
})();
