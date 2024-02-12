 window.onload = function() {
    const h2 = document.querySelector('h2');
    const p = document.querySelector('p');
    h2.style.opacity = '0';
    p.style.opacity = '0';
    setTimeout(function() {
        h2.style.opacity = '1';
        p.style.opacity = '1';
    }, 500);
}
