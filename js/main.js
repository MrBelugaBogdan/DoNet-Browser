const input = document.getElementById('browser-input');
const btn = document.getElementById('go-btn');
const display = document.getElementById('content-display');
const codeInspector = document.getElementById('code-inspector');
const consoleLog = document.getElementById('console-log');
const contextMenu = document.getElementById('context-menu');

// 1. БАЗА ДАНИХ (Твій контент на CatalystML)
const DONET_PAGES = {
    'index': '[title]DoNet Catalyst[/title][box][text]Вітаємо у вашому власному інтернеті. Тут діють ваші правила.[/text][/box][text]Швидкий доступ до вузлів:[/text][button]wiecos[/button][button]news[/button]',
    'wiecos': '[title]Wiecos 3D Engine[/title][box][color=blue]Статус системи: Очікування команди...[/color][/box][button]index[/button]',
    'news': '[title]Новини Мережі[/title][text]Сьогодні запущено власну мову розмітки CatalystML![/text][text]Додано функцію "Посмотреть код".[/text][button]index[/button]'
};

// 2. ПАРЗЕР (Перетворює CatalystML в HTML)
function parseDNL(code) {
    let html = code;
    html = html.replace(/\[title\](.*?)\[\/title\]/g, '<h1 style="color:#1a73e8">$1</h1>');
    html = html.replace(/\[text\](.*?)\[\/text\]/g, '<p>$1</p>');
    html = html.replace(/\[box\](.*?)\[\/box\]/g, '<div class="custom-box">$1</div>');
    html = html.replace(/\[button\](.*?)\[\/button\]/g, '<button class="custom-btn" onclick="input.value=\'$1\'; processInput();">$1</button>');
    html = html.replace(/\[color=(.*?)\](.*?)\[\/color\]/g, '<span style="color:$1">$2</span>');
    return html;
}

// 3. ФУНКЦІЯ ПЕРЕХОДУ
function processInput() {
    const val = input.value.trim().toLowerCase();
    logToConsole(`Запит: ${val}`);

    if (DONET_PAGES[val]) {
        const raw = DONET_PAGES[val];
        display.innerHTML = parseDNL(raw);
        codeInspector.innerText = raw; // Виводимо код в інспектор
    } else {
        display.innerHTML = `<h1>404</h1><p>Вузол ${val} не знайдено.</p>`;
        codeInspector.innerText = "Error: 404";
    }
}

// 4. ЖИВИЙ РЕДАКТОР (Зміна коду в реальному часі)
codeInspector.addEventListener('input', () => {
    const updatedCode = codeInspector.innerText;
    display.innerHTML = parseDNL(updatedCode);
    logToConsole("Код сторінки змінено в Inspector");
});

// 5. КОНТЕКСТНЕ МЕНЮ ТА DEVTOOLS
document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    contextMenu.style.top = `${e.pageY}px`;
    contextMenu.style.left = `${e.pageX}px`;
    contextMenu.classList.remove('hidden');
});

document.addEventListener('click', () => contextMenu.classList.add('hidden'));

function toggleDevTools() {
    document.getElementById('devtools').classList.toggle('devtools-hidden');
    showTab('elements');
}

function showTab(tab) {
    codeInspector.style.display = (tab === 'elements') ? 'block' : 'none';
    consoleLog.style.display = (tab === 'console') ? 'block' : 'none';
}

function logToConsole(msg) {
    const d = new Date();
    consoleLog.innerHTML += `<div>[${d.toLocaleTimeString()}] > ${msg}</div>`;
}

// ЗАПУСК ГОЛОВНОЇ СТОРІНКИ
window.onload = () => {
    input.value = 'index';
    processInput();
    logToConsole("Система Catalyst Ready.");
};

btn.addEventListener('click', processInput);
input.addEventListener('keypress', (e) => { if (e.key === 'Enter') processInput(); });
