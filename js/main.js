const SUPABASE_URL = 'https://tgatqmjeioueqhvgehlm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnYXRxbWplaW91ZXFodmdlaGxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NTQwNDgsImV4cCI6MjA4OTMzMDA0OH0.LPgm0A2YVDp5MUENQJYhDmCa3IRtEhjCXsvCwQLjSO4';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const input = document.getElementById('browser-input');
const display = document.getElementById('content-display');
const codeInspector = document.getElementById('code-inspector');
const consoleLog = document.getElementById('console-log');
const adminPanel = document.getElementById('admin-panel');
const dbStatus = document.getElementById('db-status');

// 1. ПАРЗЕР
function parseDNL(code) {
    if(!code) return "";
    let html = code;
    html = html.replace(/\[title\](.*?)\[\/title\]/gs, '<h1 style="color:#1a73e8">$1</h1>');
    html = html.replace(/\[box\](.*?)\[\/box\]/gs, '<div class="custom-box">$1</div>');
    html = html.replace(/\[text\](.*?)\[\/text\]/gs, '<p>$1</p>');
    html = html.replace(/\[button\](.*?)\[\/button\]/gs, '<button class="custom-btn" onclick="input.value=\'$1\'; processInput();">$1</button>');
    html = html.replace(/\[script\](.*?)\[\/script\]/gs, '<script>$1</script>');
    return html;
}

// 2. ПОШУК ТА ЗАВАНТАЖЕННЯ
async function processInput() {
    const val = input.value.trim().toLowerCase();
    if(!val) return;
    
    logToConsole(`Запит до глобального індексу: ${val}`);
    
    const { data, error } = await supabaseClient
        .from('sites')
        .select('*')
        .or(`name.ilike.%${val}%,title.ilike.%${val}%,description.ilike.%${val}%`);

    if(data && data.length > 0) {
        renderSearchList(data);
    } else {
        display.innerHTML = `<h2>404</h2><p>Вузол "${val}" не знайдено. Відкрийте Admin панель, щоб створити його.</p>`;
    }
}

function renderSearchList(results) {
    let html = `<p style="color:gray; font-size:13px;">Знайдено сайтів: ${results.length}</p>`;
    results.forEach(site => {
        html += `
        <div class="search-result">
            <div class="res-header">
                <div class="res-icon">${site.icon ? `<img src="${site.icon}">` : '🌐'}</div>
                <span class="res-url">dn://${site.name}</span>
            </div>
            <h3 class="res-title" onclick="openSite('${site.name}')">${site.title || site.name}</h3>
            <p class="res-desc">${site.description || 'Опис відсутній...'}</p>
        </div>`;
    });
    display.innerHTML = html;
}

async function openSite(name) {
    const { data } = await supabaseClient.from('sites').select('*').eq('name', name).single();
    if(data) {
        display.innerHTML = parseDNL(data.content);
        codeInspector.innerText = data.content;
        input.value = name;
        const scripts = display.getElementsByTagName('script');
        for (let s of scripts) { try { eval(s.innerText); } catch(e) { console.error(e); } }
    }
}

// 3. АДМІНКА: ПУБЛІКАЦІЯ З КАРТИНКОЮ
async function publishNewSite() {
    const name = document.getElementById('adm-name').value.trim().toLowerCase();
    const title = document.getElementById('adm-title').value;
    const desc = document.getElementById('adm-desc').value;
    const file = document.getElementById('adm-file').files[0];

    if(!name || !file) return alert("Треба назва сайту та іконка!");

    logToConsole(`Завантаження іконки для ${name}...`);
    
    // А) Варимо шлях
    const fileName = `${name}_${Date.now()}.png`;
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
        .from('site-assets')
        .upload(fileName, file);

    if(uploadError) return alert("Помилка Storage: " + uploadError.message);

    // Б) Отримуємо URL
    const { data: urlData } = supabaseClient.storage.from('site-assets').getPublicUrl(fileName);
    const iconUrl = urlData.publicUrl;

    // В) Пишемо в таблицю
    const { error: dbError } = await supabaseClient.from('sites').insert([{
        name: name,
        title: title,
        description: desc,
        icon: iconUrl,
        content: `[title]Вітаємо на ${title}![/title][box][text]Тут буде ваш контент.[/text][/box]`
    }]);

    if(dbError) {
        logToConsole("Помилка БД: " + dbError.message);
    } else {
        logToConsole(`Сайт ${name} успішно опубліковано з іконкою!`);
        toggleDevTools();
        input.value = name;
        processInput();
    }
}

// 4. ІНТЕРФЕЙС
function toggleDevTools() { document.getElementById('devtools').classList.toggle('devtools-hidden'); }

function showTab(tab) {
    codeInspector.style.display = (tab === 'elements') ? 'block' : 'none';
    consoleLog.style.display = (tab === 'console') ? 'block' : 'none';
    adminPanel.style.display = (tab === 'admin') ? 'block' : 'none';
}

function logToConsole(msg) {
    consoleLog.innerHTML += `<div>> ${msg}</div>`;
    consoleLog.scrollTop = consoleLog.scrollHeight;
}

window.onload = async () => {
    const { error } = await supabaseClient.from('sites').select('count');
    if(!error) {
        dbStatus.innerText = "Online"; dbStatus.style.color = "#28a745";
        input.value = 'index'; processInput();
    }
};

document.getElementById('go-btn').onclick = processInput;
input.onkeypress = (e) => { if(e.key === 'Enter') processInput(); };
document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const m = document.getElementById('context-menu');
    m.style.top = e.pageY+'px'; m.style.left = e.pageX+'px';
    m.classList.remove('hidden');
});
document.onclick = () => document.getElementById('context-menu').classList.add('hidden');
