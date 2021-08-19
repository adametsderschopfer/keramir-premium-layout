;(function () {
    document.addEventListener('DOMContentLoaded', () => {
        const preview = document.querySelector('.js-preview');

        if (preview) {
            const video = preview.querySelector('.js-preview-video');
            const control = preview.querySelector('.js-preview-video-control');

            if (video) {
                video.loop = false;
                video.volume = 0;
                
                let isPlayed = false;

                video.addEventListener('timeupdate', () => {
                    if (video.ended) {
                        video.load();
                        video.click();
                    }
                });

                preview.addEventListener('click', () => {
                    isPlayed = !isPlayed;

                    if (isPlayed) {
                        video.play();
                        control.classList.add('active');

                        const tID = setTimeout(() => {
                            control.classList.add('hide');
                            clearTimeout(tID);
                        }, 2000);
                    } else {
                        video.pause();
                        control.classList.remove('hide');
                        control.classList.remove('active');
                    }
                });
            }
        }
    })
})();
