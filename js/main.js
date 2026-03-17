// --- НАЛАШТУВАННЯ ЗАЛІЗА (ВСТАВ СВОЄ) ---
const SUPABASE_URL = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnYXRxbWplaW91ZXFodmdlaGxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NTQwNDgsImV4cCI6MjA4OTMzMDA0OH0.LPgm0A2YVDp5MUENQJYhDmCa3IRtEhjCXsvCwQLjSO4';
const SUPABASE_KEY = 'https://tgatqmjeioueqhvgehlm.supabase.co';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const input = document.getElementById('browser-input');
const btn = document.getElementById('go-btn');
const display = document.getElementById('content-display');
const codeInspector = document.getElementById('code-inspector');
const consoleLog = document.getElementById('console-log');
const suggestionsBox = document.getElementById('suggestions');
const dbStatus = document.getElementById('db-status');

// 1. ПАРЗЕР (Хмарна версія)
function parseDNL(code) {
    if (!code) return "Порожня сторінка";
    let html = code;
    html = html.replace(/\[title\](.*?)\[\/title\]/gs, '<h1 style="color:#1a73e8">$1</h1>');
    html = html.replace(/\[text\](.*?)\[\/text\]/gs, '<p>$1</p>');
    html = html.replace(/\[box\](.*?)\[\/box\]/gs, '<div class="custom-box">$1</div>');
    html = html.replace(/\[button\](.*?)\[\/button\]/gs, '<button class="custom-btn" onclick="document.getElementById(\'browser-input\').value=\'$1\'; processInput();">$1</button>');
    html = html.replace(/\[color=(.*?)\](.*?)\[\/color\]/gs, '<span style="color:$1">$2</span>');
    return html;
}

// 2. ГОЛОВНА ЛОГІКА (ЗВ'ЯЗОК ІЗ ЗАЛІЗОМ)
async function processInput() {
    let val = input.value.trim().toLowerCase();
    suggestionsBox.classList.add('hidden');
    logToConsole(`Запит до бази: ${val}`);

    if (val.startsWith('create ')) {
        const name = val.replace('create ', '').trim();
        await createSiteOnServer(name);
        return;
    }

    // Запит до таблиці 'sites'
    const { data, error } = await supabaseClient
        .from('sites')
        .select('content')
        .eq('name', val)
        .single();

    if (data) {
        display.innerHTML = parseDNL(data.content);
        codeInspector.innerText = data.content;
        logToConsole(`Сайт "${val}" успішно завантажено.`);
    } else {
        display.innerHTML = `<h1>404</h1><p>Вузол "${val}" не знайдено. Створіть його командою "create ${val}"</p>`;
        logToConsole(`Помилка: сайт ${val} не знайдено.`, "error");
    }
}

// 3. СТВОРЕННЯ НА СЕРВЕРІ
async function createSiteOnServer(name) {
    const defaultCode = `[title]Сайт ${name}[/title][box][text]Текст на сервері.[/text][/box]`;
    const { error } = await supabaseClient
        .from('sites')
        .insert([{ name: name, content: defaultCode }]);

    if (error) {
        logToConsole(`Помилка запису: ${error.message}`);
    } else {
        logToConsole(`Вузол ${name} створено в хмарі!`);
        input.value = name;
        processInput();
    }
}

// 4. ЖИВЕ ОНОВЛЕННЯ СЕРВЕРА ПРИ РЕДАГУВАННІ
let saveTimeout;
codeInspector.addEventListener('input', () => {
    const updatedCode = codeInspector.innerText;
    display.innerHTML = parseDNL(updatedCode);
    
    // Щоб не "бомбити" сервер кожною буквою, чекаємо 1 секунду після зупинки друку
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(async () => {
        const currentSite = input.value.trim().toLowerCase();
        const { error } = await supabaseClient
            .from('sites')
            .update({ content: updatedCode })
            .eq('name', currentSite);

        if (!error) logToConsole(`Хмарне збереження ${currentSite} виконано.`);
    }, 1000);
});

// 5. ДОПОМІЖНІ ФУНКЦІЇ
function logToConsole(msg) {
    const d = new Date();
    consoleLog.innerHTML += `<div>[${d.toLocaleTimeString()}] > ${msg}</div>`;
    consoleLog.scrollTop = consoleLog.scrollHeight;
}

function toggleDevTools() {
    document.getElementById('devtools').classList.toggle('devtools-hidden');
    setTimeout(() => codeInspector.focus(), 100);
}

function showTab(tab) {
    codeInspector.style.display = (tab === 'elements') ? 'block' : 'none';
    consoleLog.style.display = (tab === 'console') ? 'block' : 'none';
}

// СТАРТ
window.onload = async () => {
    // Перевірка зв'язку
    const { data, error } = await supabaseClient.from('sites').select('count', { count: 'exact' });
    if (!error) {
        dbStatus.innerText = "Online";
        dbStatus.style.color = "#28a745";
        input.value = 'index';
        processInput();
    } else {
        dbStatus.innerText = "Error";
        logToConsole("Не вдалося підключитися до Supabase!");
    }
};

btn.addEventListener('click', processInput);
input.addEventListener('keypress', (e) => { if (e.key === 'Enter') processInput(); });
document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const menu = document.getElementById('context-menu');
    menu.style.top = `${e.pageY}px`;
    menu.style.left = `${e.pageX}px`;
    menu.classList.remove('hidden');
});
document.addEventListener('click', () => document.getElementById('context-menu').classList.add('hidden'));
