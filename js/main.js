async function doNetSearch(query) {
    const searchScreen = document.getElementById('search-screen');
    const browserScreen = document.getElementById('browser-screen');
    const contentArea = document.getElementById('browser-content');

    // 1. Спочатку шукаємо ТОЧНИЙ збіг по імені (як адресний рядок)
    const { data: exactSite, error: exactError } = await supabase
        .from('sites')
        .select('*')
        .eq('name', query.toLowerCase())
        .single();

    if (exactSite) {
        // Якщо знайшли точний сайт — летимо на його сервер
        openSite(exactSite.server_url);
        return;
    }

    // 2. Якщо точного сайту нема — вмикаємо режим GOOGLE (Пошук по всій базі)
    const { data: results, error: searchError } = await supabase
        .from('sites')
        .select('*')
        .or(`name.ilike.%${query}%,title.ilike.%${query}%,description.ilike.%${query}%`);

    if (results && results.length > 0) {
        // Показуємо список знайдених сайтів
        searchScreen.style.display = 'none';
        browserScreen.style.display = 'block';
        
        let searchHTML = `<h2>Результати пошуку для: "${query}"</h2><hr>`;
        
        results.forEach(site => {
            searchHTML += `
                <div style="border: 1px solid #444; padding: 15px; margin-bottom: 10px; border-radius: 8px; cursor: pointer;" 
                     onclick="openSite('${site.server_url}')">
                    <div style="display: flex; align-items: center;">
                        <span style="font-size: 24px; margin-right: 10px;">${site.icon || '🌐'}</span>
                        <strong style="font-size: 20px; color: #00ff00;">${site.title}</strong>
                    </div>
                    <p style="margin: 5px 0; color: #aaa;">${site.description || 'Немає опису'}</p>
                    <small style="color: #666;">Автор: ${site.author || 'Анонім'} | Адреса: donet://${site.name}</small>
                </div>
            `;
        });
        
        contentArea.innerHTML = searchHTML;
    } else {
        alert("Нічого не знайдено в мережі DoNet! 🌌");
    }
}
