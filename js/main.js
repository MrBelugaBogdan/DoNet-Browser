// Ініціалізація історії з пам'яті браузера
let navigationHistory = JSON.parse(localStorage.getItem('donet_history')) || [];

window.onload = () => {
    renderHistory();
    
    // Обробка Enter для обох полів
    document.getElementById('address-bar').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') goDirect();
    });
    document.getElementById('search-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') startSearch();
    });
};

// 1. Прямий перехід по адресному рядку
async function goDirect() {
    const address = document.getElementById('address-bar').value.trim().toLowerCase();
    if (!address) return;

    const siteName = address.replace('donet://', '');
    
    const { data: site } = await supabase
        .from('sites')
        .select('*')
        .eq('name', siteName)
        .single();

    if (site) {
        saveToHistory(site.title, site.server_url, site.name);
        openSite(site.server_url);
    } else {
        alert("Помилка 404: Сайт donet://" + siteName + " не знайдено!");
    }
}

// 2. Глобальний пошук (як Google)
async function startSearch() {
    const query = document.getElementById('search-input').value.trim();
    if (!query) return;

    const { data: results } = await supabase
        .from('sites')
        .select('*')
        .or(`name.ilike.%${query}%,title.ilike.%${query}%,description.ilike.%${query}%`);

    showSearchResults(results, query);
}

// 3. Функція виходу на головну
function goHome() {
    document.getElementById('search-screen').style.display = 'block';
    document.getElementById('browser-screen').style.display = 'none';
    document.getElementById('address-bar').value = '';
}

// 4. Робота з історією
function saveToHistory(title, url, name) {
    // Видаляємо дублікат, якщо він уже був
    navigationHistory = navigationHistory.filter(s => s.name !== name);
    // Додаємо в початок
    navigationHistory.unshift({ title, url, name });
    // Залишаємо тільки 5 штук
    if (navigationHistory.length > 5) navigationHistory.pop();
    
    localStorage.setItem('donet_history', JSON.stringify(navigationHistory));
    renderHistory();
}

function renderHistory() {
    const historyDiv = document.getElementById('recent-sites');
    if (!historyDiv) return;
    
    historyDiv.innerHTML = navigationHistory.map(site => `
        <button onclick="openSite('${site.url}')" 
                style="background: #222; border: 1px solid #444; color: #00ff00; padding: 5px 15px; border-radius: 15px; cursor: pointer; font-size: 12px;">
            ${site.title}
        </button>
    `).join('');
}

// 5. Показ результатів пошуку
function showSearchResults(results, query) {
    const content = document.getElementById('browser-content');
    document.getElementById('search-screen').style.display = 'none';
    document.getElementById('browser-screen').style.display = 'block';

    if (!results || results.length === 0) {
        content.innerHTML = `<h2>Нічого не знайдено за запитом "${query}"</h2>`;
        return;
    }

    let html = `<h2>Результати пошуку:</h2><br>`;
    results.forEach(site => {
        html += `
            <div class="card" onclick="openSite('${site.server_url}'); saveToHistory('${site.title}', '${site.server_url}', '${site.name}')" 
                 style="border: 1px solid #333; padding: 15px; margin-bottom: 15px; border-radius: 10px; cursor: pointer; background: #111;">
                <span style="font-size: 24px;">${site.icon || '🌐'}</span>
                <strong style="color: #00ff00; font-size: 20px;">${site.title}</strong>
                <p style="color: #ccc; margin: 5px 0;">${site.description}</p>
                <small style="color: #666;">Автор: ${site.author} | donet://${site.name}</small>
            </div>
        `;
    });
    content.innerHTML = html;
}
