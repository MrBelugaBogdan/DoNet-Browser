// Покращений живий редактор
codeInspector.contentEditable = "true";
codeInspector.style.outline = "none"; // Прибираємо синю рамку при кліку

// Дозволяємо всім клавішам працювати всередині інспектора
codeInspector.addEventListener('keydown', (e) => {
    e.stopPropagation(); // Це важливо! Зупиняє перехоплення клавіш іншими частинами сайту
});

codeInspector.addEventListener('input', () => {
    // innerText краще за innerHTML для коду, бо не додає зайвих <br>
    const updatedCode = codeInspector.innerText; 
    display.innerHTML = parseDNL(updatedCode);
    logToConsole("Код оновлено");
});

// Додамо фокус при відкритті DevTools
function toggleDevTools() {
    const dev = document.getElementById('devtools');
    dev.classList.toggle('devtools-hidden');
    if (!dev.classList.contains('devtools-hidden')) {
        showTab('elements');
        setTimeout(() => codeInspector.focus(), 100); // Автоматично ставимо курсор
    }
}
