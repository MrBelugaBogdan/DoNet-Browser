const input = document.getElementById('browser-input');
const btn = document.getElementById('go-btn');
const display = document.getElementById('content-display');
const codeInspector = document.getElementById('code-inspector');
const consoleLog = document.getElementById('console-log');
const contextMenu = document.getElementById('context-menu');

// Наша майбутня "Мова Сайтів" (База даних)
const DONET_PAGES = {
    'wiecos': '[title]Wiecos 3D Engine[/title][box]Вузол активний. Система рендерингу підключена.[/box][button]Запустити Світ[/button]',
    'news': '[title]Центр Новин DoNet[/title][text]Браузер Catalyst перейшов на модульну систему файлів.[/text][text]Розробник підключив DevTools.[/text]',
    'home': '[title]Головна[/title][text]Це ваш домашній вузол у мережі DoNet.[/text]'
};

// 1. Функція перетворення нашої мови в HTML
function parseDNL(code) {
    let html = code;
    html = html.replace(/\[title\](.*?)\[\/title\]/g, '<h1 style="color:#1a73e8">$1</h1>');
    html = html.replace(/\[text\](.*?)\[\/text\]/g, '<p>$1</p>');
    html = html.replace(/\[box\](.*?)\[\/box\]/g, '<div style="border:1px solid #ddd; padding:10px; border-radius:5px">$1</div>');
    html = html.replace(/\[button\](.*?)\[\/button\]/g, '<button style="margin-top:10px; padding:10px; cursor:pointer">$1</button>');
    return html;
}

// 2. Логіка пошуку та переходу
function processInput() {
    const val = input.value.trim().toLowerCase();
    logToConsole(`Запит до вузла: ${val}`);

    if (DONET_PAGES[val]) {
        const rawCode = DONET_PAGES[val];
        display.innerHTML = parseDNL(rawCode);
        codeInspector.innerText = rawCode; // Показуємо код у вкладці Elements
        logToConsole(`Сторінку ${val} успішно завантажено.`);
    } else {
        display.innerHTML = `<h3>Помилка 404</h3><p>Вузол "${val}" не знайдено в мережі.</p>`;
        codeInspector.innerText = "Error: 404 Page Not Found";
        logToConsole(`Помилка: ${val} відсутній.`, "error");
    }
}

// 3. Контекстне меню
document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    contextMenu.style.top = `${e.pageY}px`;
    contextMenu.style.left = `${e.pageX}px`;
    contextMenu.classList.remove('hidden');
});

document.addEventListener('click', () => contextMenu.classList.add('hidden'));

// 4. DevTools
function toggleDevTools() {
    document.getElementById('devtools').classList.toggle('devtools-hidden');
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

function logToConsole(msg) {
    const div = document.createElement('div');
    div.innerText = `> ${msg}`;
    consoleLog.appendChild(div);
}

// Слухачі подій
btn.addEventListener('click', processInput);
input.addEventListener('keypress', (e) => { if (e.key === 'Enter') processInput(); });

logToConsole("Система Catalyst завантажена. Готовність 100%.");
