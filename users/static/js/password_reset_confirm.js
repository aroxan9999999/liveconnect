 document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('form');
    form.style.opacity = 0;

    setTimeout(() => {
        form.style.opacity = 1;
        form.style.transition = 'opacity 2s';
    }, 500);
});