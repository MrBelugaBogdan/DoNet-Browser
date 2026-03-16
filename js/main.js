const input = document.getElementById('browser-input');
const btn = document.getElementById('go-btn');
const display = document.getElementById('content-display');

// Об’єкт з контентом "сайтів" (база даних твого інтернету)
const DONET_PAGES = {
    'wiecos': '[title]Wiecos Engine[/title][text]Завантаження 3D простору...[/text][button]Увійти в гру[/button]',
    'news': '[title]Новини DoNet[/title][text]Сьогодні запущено першу версію браузера Catalyst.[/text]',
    'dev': '[title]Developer Mode[/title][text]Вітаємо, розробнику. Система готова до масштабування.[/text]'
};

// Функція-"парзер", яка перетворює твою мову на HTML
function parseDNL(code) {
    let html = code;
    html = html.replace(/\[title\](.*?)\[\/title\]/g, '<h1>$1</h1>');
    html = html.replace(/\[text\](.*?)\[\/text\]/g, '<p>$2</p>'); // Виправлено regex для тексту
    html = html.replace(/\[button\](.*?)\[\/button\]/g, '<button class="dnl-btn">$1</button>');
    html = html.replace(/\[box\](.*?)\[\/box\]/g, '<div class="dnl-box">$1</div>');
    return html;
}

function processInput() {
    const val = input.value.trim().toLowerCase();
    
    if (DONET_PAGES[val]) {
        // Якщо знайшли "сайт" у нашій базі — рендеримо його через парзер
        display.innerHTML = parseDNL(DONET_PAGES[val]);
    } else {
        // Якщо це просто текст, шукаємо в мережі
        display.innerHTML = `<h3>Пошук: ${val}</h3><p>Сторінку не знайдено в базі DoNet.</p>`;
    }
}

btn.addEventListener('click', processInput);
input.addEventListener('keypress', (e) => { if (e.key === 'Enter') processInput(); });
