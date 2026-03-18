// --- КОНФІГУРАЦІЯ ЗВ'ЯЗКУ ІЗ ЗАЛІЗОМ ---
const SUPABASE_URL = 'https://tgatqmjeioueqhvgehlm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnYXRxbWplaW91ZXFodmdlaGxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NTQwNDgsImV4cCI6MjA4OTMzMDA0OH0.LPgm0A2YVDp5MUENQJYhDmCa3IRtEhjCXsvCwQLjSO4';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const input = document.getElementById('browser-input');
const btn = document.getElementById('go-btn');
const display = document.getElementById('content-display');
const codeInspector = document.getElementById('code-inspector');
const consoleLog = document.getElementById('console-log');
const dbStatus = document.getElementById('db-status');

// 1. ПАРЗЕР CATALYST ML (Мова твоєї мережі)
function parseDNL(code) {
    if (!code) return "<p>Порожня сторінка або сервер не повернув код.</p>";
    let html = code;
    
    // Теги оформлення
    html = html.replace(/\[title\](.*?)\[\/title\]/gs, '<h1 class="page-title">$1</h1>');
    html = html.replace(/\[text\](.*?)\[\/text\]/gs, '<p class="page-text">$1</p>');
    html = html.replace(/\[box\](.*?)\[\/box\]/gs, '<div class="custom-box">$1</div>');
    
    // Кнопка переходу (Catalyst Button)
    html = html.replace(/\[button\](.*?)\[\/button\]/gs, '<button class="custom-btn" onclick="input.value=\'$1\'; processInput();">$1</button>');
    
    // Підтримка JS скриптів всередині сторінок
    html = html.replace(/\[script\](.*?)\[\/script\]/gs, '<script>$1</script>');
    
    return html;
}

// 2. ГОЛОВНА ФУНКЦІЯ ОБРОБКИ ЗАПИТУ (ПОШУК ТА ВІДКРИТТЯ)
async function processInput() {
    const val = input.value.trim().toLowerCase();
    if (!val) return;

    logToConsole(`Запит до мережі: ${val}`);
    display.innerHTML = "<p>Встановлення з'єднання...</p>";

    // Шукаємо сайт в базі (за ім'ям, заголовком або описом)
    const { data, error } = await supabaseClient
        .from('sites')
        .select('*')
        .or(`name.eq.${val},title.ilike.%${val}%,description.ilike.%${val}%`);

    if (error) {
        logToConsole(`Помилка бази: ${error.message}`, "error");
        return;
    }

    if (data && data.length > 0) {
        // Якщо знайшли ТІЛЬКИ ОДИН точний збіг по імені - відкриваємо його відразу
        const exactMatch = data.find(s => s.name === val);
        if (exactMatch) {
            openSite(exactMatch);
        } else {
            // Якщо кілька схожих результатів - показуємо список (як Google)
            renderSearchList(data);
        }
    } else {
        display.innerHTML = `
            <div class="error-404">
                <h1>404: Вузол не знайдено</h1>
                <p>Сайту "${val}" ще не існує в DoNet.</p>
                <button onclick="toggleDevTools()">Створити цей вузол через Admin</button>
            </div>`;
    }
}

// 3. ФУНКЦІЯ ВІДКРИТТЯ САЙТУ (БАЗА VS ПІТОН)
async function openSite(siteData) {
    logToConsole(`Відкриття вузла: ${siteData.name}`);
    input.value = siteData.name;

    // ПЕРЕВІРКА: Якщо є посилання на сервер (Google Colab / Replit)
    if (siteData.server_url && siteData.server_url.length > 10) {
        logToConsole(`Запит до зовнішнього заліза (Python): ${siteData.server_url}`);
        try {
            const response = await fetch(siteData.server_url);
            const remoteCode = await response.text();
            renderFinalHTML(remoteCode);
        } catch (e) {
            logToConsole("Сервер не відповідає! Можливо, ви забули запустити Python?", "error");
            display.innerHTML = `<h1>Сервер Офлайн</h1><p>Вузол ${siteData.name} вимагає запущеного Python-сервера.</p>`;
        }
    } else {
        // Якщо сервера немає - беремо звичайний контент із Supabase
        logToConsole("Завантаження коду з хмарної бази даних.");
        renderFinalHTML(siteData.content);
    }
}

// 4. ВІДОБРАЖЕННЯ КОДУ ТА ЗАПУСК СКРИПТІВ
function renderFinalHTML(code) {
    display.innerHTML = parseDNL(code);
    codeInspector.innerText = code; // Виводимо сирий код в Elements

    // Виконуємо скрипти [script]...[/script]
    const scripts = display.getElementsByTagName('script');
    for (let s of scripts) {
        try {
            eval(s.innerText);
        } catch (err) {
            logToConsole(`Помилка в скрипті сайту: ${err.message}`, "error");
        }
    }
}

// 5. МАЛЮВАННЯ СПИСКУ ПОШУКУ (GOOGLE STYLE)
function renderSearchList(results) {
    let html = `<p style="color:gray; font-size:12px; margin-bottom:20px;">Знайдено сайтів: ${results.length}</p>`;
    results.forEach(site => {
        html += `
        <div class="search-result">
            <div class="res-header">
                <div class="res-icon">${site.icon ? `<img src="${site.icon}">` : '🌐'}</div>
                <span class="res-url">dn://${site.name}</span>
            </div>
            <h3 class="res-title" onclick='openSite(${JSON.stringify(site)})'>${site.title || site.name}</h3>
            <p class="res-desc">${site.description || 'Опис відсутній...'}</p>
        </div>`;
    });
    display.innerHTML = html;
}

// 6. АДМІНКА: ПУБЛІКАЦІЯ З КАРТИНКОЮ
async function publishNewSite() {
    const name = document.getElementById('adm-name').value.trim().toLowerCase();
    const title = document.getElementById('adm-title').value;
    const desc = document.getElementById('adm-desc').value;
    const file = document.getElementById('adm-file').files[0];

    if (!name || !file) return alert("Вкажіть назву сайту та виберіть іконку!");

    logToConsole(`Завантаження іконки для ${name} на Storage...`);
    
    // А) Завантаження файлу в твій бакет site-assets
    const fileName = `${name}_icon.png`;
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
        .from('site-assets')
        .upload(fileName, file, { upsert: true });

    if (uploadError) return alert("Помилка завантаження: " + uploadError.message);

    // Б) Отримання публічного посилання
    const { data: urlData } = supabaseClient.storage.from('site-assets').getPublicUrl(fileName);
    const iconUrl = urlData.publicUrl;

    // В) Запис в таблицю 'sites'
    const { error: dbError } = await supabaseClient.from('sites').insert([{
        name: name,
        title: title,
        description: desc,
        icon: iconUrl,
        content: `[title]Вітаємо на ${title}![/title][box][text]Ваш новий сайт у DoNet.[/text][/box]`
    }]);

    if (dbError) {
        logToConsole(`Помилка реєстрації: ${dbError.message}`, "error");
    } else {
        logToConsole(`Вузол ${name} активовано в глобальній мережі!`);
        toggleDevTools();
        input.value = name;
        processInput();
    }
}

// --- СЕРВІСНІ ФУНКЦІЇ ---

function logToConsole(msg, type = "info") {
    const color = type === "error" ? "red" : "#00ff41";
    consoleLog.innerHTML += `<div style="color:${color}">> ${msg}</div>`;
    consoleLog.scrollTop = consoleLog.scrollHeight;
}

function toggleDevTools() { 
    document.getElementById('devtools').classList.toggle('devtools-hidden'); 
}

function showTab(tab) {
    document.getElementById('code-inspector').style.display = (tab === 'elements') ? 'block' : 'none';
    document.getElementById('console-log').style.display = (tab === 'console') ? 'block' : 'none';
    document.getElementById('admin-panel').style.display = (tab === 'admin') ? 'block' : 'none';
}

window.onload = async () => {
    // Перевірка зв'язку при старті
    const { data, error } = await supabaseClient.from('sites').select('count');
    if (!error) {
        dbStatus.innerText = "Online";
        dbStatus.style.color = "#28a745";
        logToConsole("Система DoNet підключена до хмари.");
    } else {
        dbStatus.innerText = "Offline";
        logToConsole("ПОМИЛКА: Не вдалося з'єднатися з базою!", "error");
    }
};

// Прослуховування кнопок
btn.onclick = processInput;
input.onkeypress = (e) => { if (e.key === 'Enter') processInput(); };

// Контекстне меню
document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const m = document.getElementById('context-menu');
    m.style.top = e.pageY + 'px';
    m.style.left = e.pageX + 'px';
    m.classList.remove('hidden');
});
document.onclick = () => document.getElementById('context-menu').classList.add('hidden');
