const devTools = document.getElementById('devtools');
const codeInspector = document.getElementById('code-inspector');
const consoleLog = document.getElementById('console-log');

// Функція для логування в нашу консоль
function logToConsole(message) {
    const entry = document.createElement('div');
    entry.innerText = `[${new Date().toLocaleTimeString()}] > ${message}`;
    consoleLog.appendChild(entry);
}

function toggleDevTools() {
    devTools.classList.toggle('devtools-hidden');
    logToConsole("DevTools toggled");
}

function showTab(tab) {
    if (tab === 'elements') {
        codeInspector.style.display = 'block';
        consoleLog.style.display = 'none';
    } else {
        codeInspector.style.display = 'none';
        consoleLog.style.display = 'block';
    }
}

// Оновлена функція процесу вводу
function processInput() {
    const val = input.value.trim().toLowerCase();
    logToConsole(`Запит до вузла: ${val}`);
    
    if (DONET_PAGES[val]) {
        const rawCode = DONET_PAGES[val];
        codeInspector.innerText = rawCode; // Показуємо "сирий" код у вкладці Elements
        display.innerHTML = parseDNL(rawCode);
        logToConsole(`Вузол ${val} успішно рендеровано.`);
    } else {
        display.innerHTML = `<h3>Помилка 404</h3>`;
        codeInspector.innerText = "Error: Page not found";
        logToConsole(`Помилка: Вузол ${val} не знайдено.`, "error");
    }
}
