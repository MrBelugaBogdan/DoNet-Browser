const input = document.getElementById('browser-input');
const btn = document.getElementById('go-btn');
const display = document.getElementById('content-display');
const codeInspector = document.getElementById('code-inspector');
const consoleLog = document.getElementById('console-log');
const contextMenu = document.getElementById('context-menu');
const suggestionsBox = document.getElementById('suggestions');

// 1. БАЗА ДАНИХ ТА ПІДКАЗКИ
let DONET_PAGES = {
    'index': '[title]DoNet Catalyst[/title][box][text]Ваш браузер працює. Введіть "wiki" або створіть сайт командою "create назва".[/text][/box]',
    'wiki': '[title]DoNet Wiki[/title][box][text]Енциклопедія знань мережі DoNet.[/text][/box][button]index[/button]',
    'wiecos': '[title]Wiecos Engine[/title][text]Вузол 3D рендерингу.[/text][button]index[/button]'
};

const SUGGESTIONS_LIST = ['index', 'wiki', 'wiecos', 'create ', 'help', 'about'];

// 2. ПАРЗЕР CatalystML
function parseDNL(code) {
    let html = code;
    html = html.replace(/\[title\](.*?)\[\/title\]/g, '<h1 style="color:#1a73e8">$1</h1>');
    html = html.replace(/\[text\](.*?)\[\/text\]/g, '<p>$1</p>');
    html = html.replace(/\[box\](.*?)\[\/box\]/g, '<div class="custom-box">$1</div>');
    html = html.replace(/\[button\](.*?)\[\/button\]/g, '<button class="custom-btn" onclick="document.getElementById(\'browser-input\').value=\'$1\'; processInput();">$1</button>');
    html = html.replace(/\[color=(.*?)\](.*?)\[\/color\]/g, '<span style="color:$1">$2</span>');
    return html;
}

// 3. ЛОГІКА ПОШУКУ ТА СТВОРЕННЯ
function processInput() {
    let val = input.value.trim().toLowerCase();
    suggestionsBox.classList.add('hidden');
    logToConsole(`Запит: ${val}`);

    // Команда на створення
    if (val.startsWith('create ')) {
        const name = val.replace('create ', '').trim();
        if (name && !DONET_PAGES[name]) {
            DONET_PAGES[name] = `[title]Сайт: ${name}[/title][box][text]Нова сторінка. Відредагуйте її через Elements.[/text][/box][button]index[/button]`;
            val = name;
            logToConsole(`Створено сайт: ${name}`);
        }
    }

    if (DONET_PAGES[val]) {
        const raw = DONET_PAGES[val];
        display.innerHTML = parseDNL(raw);
        codeInspector.innerText = raw;
    } else {
        display.innerHTML = `<h1>404</h1><p>Вузол "${val}" не знайдено. Напишіть "create ${val}" щоб створити його.</p>`;
    }
}

// 4. АВТОДОПОВНЕННЯ (Google Style)
input.addEventListener('input', () => {
    const val = input.value.toLowerCase();
    suggestionsBox.innerHTML = '';
    if (val) {
        const filtered = SUGGESTIONS_LIST.filter(s => s.startsWith(val));
        if (filtered.length > 0) {
            suggestionsBox.classList.remove('hidden');
            filtered.forEach(s => {
                const div = document.createElement('div');
                div.innerText = s;
                div.onclick = () => { input.value = s; processInput(); };
                suggestionsBox.appendChild(div);
            });
        } else {
            suggestionsBox.classList.add('hidden');
        }
    } else {
        suggestionsBox.classList.add('hidden');
    }
});

// 5. РЕДАКТОР (Elements)
codeInspector.addEventListener('keydown', (e) => e.stopPropagation());
codeInspector.addEventListener('input', () => {
    display.innerHTML = parseDNL(codeInspector.innerText);
    logToConsole("Код змінено в реальному часі");
});

// 6. DEVTOOLS ТА МЕНЮ
document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    contextMenu.style.top = `${e.pageY}px`;
    contextMenu.style.left = `${e.pageX}px`;
    contextMenu.classList.remove('hidden');
});

document.addEventListener('click', () => contextMenu.classList.add('hidden'));

function toggleDevTools() {
    const dev = document.getElementById('devtools');
    dev.classList.toggle('devtools-hidden');
    if (!dev.classList.contains('devtools-hidden')) {
        showTab('elements');
        setTimeout(() => codeInspector.focus(), 100);
    }
}

function showTab(tab) {
    codeInspector.style.display = (tab === 'elements') ? 'block' : 'none';
    consoleLog.style.display = (tab === 'console') ? 'block' : 'none';
}

function logToConsole(msg) {
    const d = new Date();
    consoleLog.innerHTML += `<div>[${d.toLocaleTimeString()}] > ${msg}</div>`;
    consoleLog.scrollTop = consoleLog.scrollHeight;
}

window.onload = () => {
    input.value = 'index';
    processInput();
    logToConsole("Система готова.");
};

btn.addEventListener('click', processInput);
input.addEventListener('keypress', (e) => { if (e.key === 'Enter') processInput(); });
