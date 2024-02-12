window.onload = function() {
    const form = document.querySelector('form');
    form.style.opacity = '0';
    setTimeout(function() {
        form.style.opacity = '1';
    }, 500);
}
