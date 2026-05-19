// Эмуляция базы данных и глобального состояния через localStorage
let appState = {
    currentUser: null,
    usersDB: JSON.parse(localStorage.getItem('p_users')) || {
        'qweezer': { password: '123', role: 'admin', friends: [], historyIn: [], historyOut: [] }
    },
    posts: JSON.parse(localStorage.getItem('p_posts')) || [],
    news: JSON.parse(localStorage.getItem('p_news')) || [
        { text: 'Добро пожаловать в обновленную версию PinkCards на GitHub Pages!', date: '19.05.2026' }
    ],
    siteSettings: JSON.parse(localStorage.getItem('p_settings')) || { logo: '🌸 PinkCards', bg: '' }
};

// Текущее состояние редактора (параметры из editor.js + доработки ТЗ)
let cardState = {
    text: '', textColor: '#333333', textCenter: false, textBold: false,
    buttonText: 'Открыть открытку', buttonBgColor: '#faceb1', buttonTextColor: '#ffffff',
    buttonStyle: 'rounded', buttonSize: 50, buttonPhoto: null,
    stickers: [], photos: [], photoSize: 100,
    bgColor1: '#faceb1', bgColor2: '#ffa58a',
    patternData: null, patternOpacity: 40, patternSize: 50, animation: 'gift'
};

document.addEventListener('DOMContentLoaded', function() {
    applyGlobalSettings();
    initTabsAndBurger();
    initStickersSelector();
    initEditorBinding();
    initAuthEngine();
    renderFeed();
    renderNews();
    updateLivePreview();
});

// Глобальные настройки администрирования
function applyGlobalSettings() {
    const logos = document.querySelectorAll('#siteLogo');
    logos.forEach(el => el.textContent = appState.siteSettings.logo);
    if(appState.siteSettings.bg) {
        document.body.style.backgroundImage = `url(${appState.siteSettings.bg})`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundAttachment = 'fixed';
    } else {
        document.body.style.backgroundImage = 'none';
    }
}

// Управление вкладками и боковым мобильным меню
function initTabsAndBurger() {
    const tabs = document.querySelectorAll('.tab-btn');
    const sideLinks = document.querySelectorAll('.side-menu .menu-items a');
    
    function changeTab(tabId) {
        document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
        tabs.forEach(t => t.classList.remove('active'));
        
        const currentTab = document.getElementById(`${tabId}Tab`);
        const currentBtn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
        
        if (currentTab) currentTab.classList.add('active');
        if (currentBtn) currentBtn.classList.add('active');
        document.getElementById('sideMenu').classList.remove('active');
    }

    tabs.forEach(btn => btn.addEventListener('click', () => changeTab(btn.dataset.tab)));
    sideLinks.forEach(link => link.addEventListener('click', (e) => {
        e.preventDefault();
        changeTab(link.dataset.target);
    }));

    document.getElementById('siteLogo').addEventListener('click', () => changeTab('create'));
    document.getElementById('burgerBtn').addEventListener('click', () => document.getElementById('sideMenu').classList.add('active'));
    document.getElementById('closeMenuBtn').addEventListener('click', () => document.getElementById('sideMenu').classList.remove('active'));
}

// Генерация сетки базовых эмодзи
function initStickersSelector() {
    const defaultEmojis = ['😊','❤️','🎉','🎂','⭐','✨','🌸','🐱','💖','🌈','🎈','🥳','💩','💐','💨','📦','🍬','🧸','🍕','🐱','🐶'];
    const grid = document.getElementById('stickersGrid');
    if(!grid) return;
    grid.innerHTML = '';
    defaultEmojis.forEach(emoji => {
        const item = document.createElement('span');
        item.className = 'sticker';
        item.textContent = emoji;
        item.addEventListener('click', () => pushSticker(emoji));
        grid.appendChild(item);
    });
}

function pushSticker(emoji) {
    if (cardState.stickers.length >= 30) { alert('Лимит 30 эмодзи превышен!'); return; }
    cardState.stickers.push(emoji);
    syncListsUI();
    updateLivePreview();
}

function syncListsUI() {
    document.getElementById('selectedStickers').innerHTML = cardState.stickers.map((s, i) => `
        <div class="sticker-item">${s} <span onclick="removeStickerItem(${i})">✖</span></div>
    `).join('');
    
    document.getElementById('selectedPhotos').innerHTML = cardState.photos.map((p, i) => `
        <div class="photo-item">📷 Фото ${i+1} <span onclick="removePhotoItem(${i})">✖</span></div>
    `).join('');
}

window.removeStickerItem = function(index) { cardState.stickers.splice(index, 1); syncListsUI(); updateLivePreview(); };
window.removePhotoItem = function(index) { cardState.photos.splice(index, 1); syncListsUI(); updateLivePreview(); };

// Связывание интерфейса редактора с объектом состояния открытки
function initEditorBinding() {
    document.getElementById('cardText').addEventListener('input', (e) => { cardState.text = e.target.value; updateLivePreview(); });
    document.getElementById('textCenter').addEventListener('change', (e) => { cardState.textCenter = e.target.checked; updateLivePreview(); });
    document.getElementById('textBold').addEventListener('change', (e) => { cardState.textBold = e.target.checked; updateLivePreview(); });
    document.getElementById('textColor').addEventListener('input', (e) => { cardState.textColor = e.target.value; updateLivePreview(); });
    
    document.getElementById('buttonText').addEventListener('input', (e) => { cardState.buttonText = e.target.value; updateLivePreview(); });
    document.getElementById('buttonBgColor').addEventListener('input', (e) => { cardState.buttonBgColor = e.target.value; updateLivePreview(); });
    document.getElementById('buttonTextColor').addEventListener('input', (e) => { cardState.buttonTextColor = e.target.value; updateLivePreview(); });
    document.getElementById('buttonStyle').addEventListener('change', (e) => { cardState.buttonStyle = e.target.value; updateLivePreview(); });
    
    document.getElementById('buttonSize').addEventListener('input', (e) => {
        cardState.buttonSize = e.target.value;
        document.getElementById('sizeValue').textContent = e.target.value;
        updateLivePreview();
    });
    document.getElementById('photoSize').addEventListener('input', (e) => {
        cardState.photoSize = e.target.value;
        document.getElementById('photoSizeValue').textContent = e.target.value;
        updateLivePreview();
    });
    document.getElementById('patternSize').addEventListener('input', (e) => {
        cardState.patternSize = parseInt(e.target.value);
        document.getElementById('patternSizeValue').textContent = e.target.value;
        updateLivePreview();
    });
    document.getElementById('patternOpacity').addEventListener('input', (e) => {
        cardState.patternOpacity = parseInt(e.target.value);
        document.getElementById('patternOpacityValue').textContent = e.target.value;
        updateLivePreview();
    });

    document.getElementById('bgColor1').addEventListener('input', (e) => { cardState.bgColor1 = e.target.value; updateLivePreview(); });
    document.getElementById('bgColor2').addEventListener('input', (e) => { cardState.bgColor2 = e.target.value; updateLivePreview(); });

    document.getElementById('addCustomSticker').addEventListener('click', () => {
        const inp = document.getElementById('customSticker');
        if(inp.value.trim()) { pushSticker(inp.value.trim()); inp.value = ''; }
    });

    // Обработка FileReader для картинок
    document.getElementById('photoUpload').addEventListener('change', (e) => {
        if(e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (ev) => { cardState.photos.push(ev.target.result); syncListsUI(); updateLivePreview(); };
            reader.readAsDataURL(e.target.files[0]);
        }
    });

    document.getElementById('buttonPhotoInput').addEventListener('change', (e) => {
        if(e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (ev) => { cardState.buttonPhoto = ev.target.result; updateLivePreview(); };
            reader.readAsDataURL(e.target.files[0]);
        }
    });

    document.getElementById('patternUpload').addEventListener('change', (e) => {
        if(e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (ev) => { cardState.patternData = ev.target.result; updateLivePreview(); };
            reader.readAsDataURL(e.target.files[0]);
        }
    });

    document.getElementById('clearPattern').addEventListener('click', () => { cardState.patternData = null; updateLivePreview(); });

    // Кнопки переключения анимаций
    const animBtns = document.querySelectorAll('.anim-select-btn');
    animBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            animBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            cardState.animation = btn.dataset.animation;
        });
    });

    document.getElementById('saveCardBtn').addEventListener('click', commitPublishCard);

    // Триггер запуска демонстрации анимации в окне Предпросмотра
    document.getElementById('liveButton').addEventListener('click', () => {
        executeCardCoreAnimation('animationStage', cardState, 'liveText', 'liveStickers', 'livePhotos');
    });
}

// Отрисовка паттерна сеткой (Интеграция логики вашего оригинального editor.js)
function drawPatternGrid(container, state) {
    if(!container) return;
    container.innerHTML = '';
    if(!state.patternData) return;

    // Рассчитываем количество необходимых плиток на основе размеров контейнера превью
    const cols = Math.ceil(500 / state.patternSize);
    const rows = Math.ceil(400 / state.patternSize);

    for (let i = 0; i < cols * rows; i++) {
        const img = document.createElement('img');
        img.src = state.patternData;
        img.style.width = `${state.patternSize}px`;
        img.style.height = `${state.patternSize}px`;
        img.style.position = 'absolute';
        img.style.left = `${(i % cols) * state.patternSize}px`;
        img.style.top = `${Math.floor(i / cols) * state.patternSize}px`;
        img.style.opacity = state.patternOpacity / 100;
        container.appendChild(img);
    }
}

// Обновление интерфейса Живого предпросмотра
function updateLivePreview() {
    const box = document.getElementById('livePreview');
    if(!box) return;

    box.style.background = `linear-gradient(135deg, ${cardState.bgColor1}, ${cardState.bgColor2})`;
    drawPatternGrid(document.getElementById('livePattern'), cardState);

    // Стилизация кнопки
    const btn = document.getElementById('liveButton');
    btn.textContent = cardState.buttonText;
    btn.style.color = cardState.buttonTextColor;
    btn.style.padding = `${cardState.buttonSize * 0.2}px ${cardState.buttonSize * 0.5}px`;
    btn.style.background = cardState.buttonPhoto ? `url(${cardState.buttonPhoto}) center/cover` : cardState.buttonBgColor;

    btn.style.borderRadius = cardState.buttonStyle === 'rounded' ? '50px' : cardState.buttonStyle === 'square' ? '4px' : '8px';
    btn.style.boxShadow = cardState.buttonStyle === 'glow' ? `0 0 15px ${cardState.buttonBgColor}` : 'none';

    // Подготовка контента к скрытию перед воспроизведением анимации
    const t = document.getElementById('liveText');
    t.classList.remove('visible');
    t.textContent = cardState.text || 'Текст открытки';
    t.style.color = cardState.textColor;
    t.style.textAlign = cardState.textCenter ? 'center' : 'left';
    t.style.fontWeight = cardState.textBold ? 'bold' : 'normal';

    const s = document.getElementById('liveStickers');
    s.classList.remove('visible');
    s.innerHTML = cardState.stickers.map(st => `<span>${st}</span>`).join(' ');

    const p = document.getElementById('livePhotos');
    p.classList.remove('visible');
    p.innerHTML = cardState.photos.map(ph => `<img src="${ph}" style="width:${cardState.photoSize}px; border-radius:6px; margin:4px;">`).join('');
}

// СИСТЕМА ДВИЖКА АНИМАЦИЙ (Все 5 эффектов из ТЗ)
function executeCardCoreAnimation(stageId, state, txtId, stkId, phtId) {
    const stage = document.getElementById(stageId);
    if(!stage) return;
    stage.innerHTML = '';

    const t = document.getElementById(txtId);
    const s = document.getElementById(stkId);
    const p = document.getElementById(phtId);

    // Запуск анимации появления контента
    setTimeout(() => {
        if(t) t.classList.add('visible');
        if(s) s.classList.add('visible');
        if(p) p.classList.add('visible');
    }, 400);

    // Физика частиц в зависимости от выбора
    if(state.animation === 'gift' || state.animation === 'bouquet') {
        let pEmoji = state.animation === 'gift' ? '🎉' : '🌸';
        
        if(state.animation === 'gift') {
            const box = document.createElement('div');
            box.className = 'falling-element';
            box.textContent = '🎁';
            stage.appendChild(box);
        }

        for(let i=0; i<30; i++) {
            const part = document.createElement('div');
            part.className = 'particle';
            part.textContent = pEmoji;
            part.style.left = '50%'; part.style.top = '40%';
            part.style.setProperty('--dx', `${(Math.random() - 0.5) * 260}px`);
            part.style.setProperty('--dy', `${(Math.random() - 0.5) * 260}px`);
            stage.appendChild(part);
        }
    }
    else if(state.animation === 'poop') {
        const poop = document.createElement('div');
        poop.className = 'falling-element';
        poop.textContent = '💩';
        stage.appendChild(poop);

        setTimeout(() => {
            for(let i=0; i<15; i++) {
                const splash = document.createElement('div');
                splash.className = 'particle';
                splash.textContent = '💦';
                splash.style.left = '50%'; splash.style.top = '40%';
                splash.style.setProperty('--dx', `${(Math.random() - 0.5) * 160}px`);
                splash.style.setProperty('--dy', `${(Math.random() - 0.2) * -120}px`);
                stage.appendChild(splash);
            }
        }, 500);
    }
    else if(state.animation === 'fart') {
        for(let i=0; i<12; i++) {
            const cloud = document.createElement('div');
            cloud.className = 'fart-cloud';
            cloud.textContent = '💨';
            cloud.style.left = '45%'; cloud.style.top = '35%';
            cloud.style.setProperty('--gx', `${(Math.random() - 0.5) * 180}px`);
            cloud.style.setProperty('--gy', `${(Math.random() - 0.5) * 180}px`);
            stage.appendChild(cloud);
        }
    }
    else if(state.animation === 'fall') {
        const box = document.createElement('div');
        box.className = 'falling-element';
        box.textContent = '📦';
        stage.appendChild(box);
    }
}

// Функция публикации новой открытки
function commitPublishCard() {
    if(!cardState.text.trim()) { alert('Пожалуйста, напишите поздравление!'); return; }
    
    const post = {
        id: Date.now(),
        author: appState.currentUser ? appState.currentUser.name : 'Аноним',
        date: new Date().toLocaleDateString(),
        isPrivate: document.getElementById('isPrivate').checked,
        likes: [],
        comments: [],
        cardData: JSON.parse(JSON.stringify(cardState))
    };

    appState.posts.unshift(post);
    localStorage.setItem('p_posts', JSON.stringify(appState.posts));

    if(appState.currentUser) {
        appState.usersDB[appState.currentUser.name].historyOut.push(post.id);
        localStorage.setItem('p_users', JSON.stringify(appState.usersDB));
        syncProfileUI();
    }

    alert('✨ Открытка успешно размещена в системе!');
    renderFeed();
}

// Отрисовка Instagram Ленты
function renderFeed() {
    const feed = document.getElementById('instagramFeed');
    const adminGrid = document.getElementById('adminAllCardsGrid');
    if(!feed) return;

    let feedHTML = '';
    let adminHTML = '';

    appState.posts.forEach(post => {
        const isMe = appState.currentUser && appState.currentUser.name === post.author;
        const isAdmin = appState.currentUser && appState.currentUser.role === 'admin';
        const isMyFriend = appState.currentUser && appState.usersDB[appState.currentUser.name].friends.includes(post.author);

        const postUI = `
            <div class="insta-post">
                <div class="post-header">
                    <div class="post-avatar">${post.author[0].toUpperCase()}</div>
                    <div class="post-meta">
                        <span class="post-user">${post.author} ${post.isPrivate ? '🔒 (Приватная)' : ''}</span>
                        <span class="post-date">${post.date}</span>
                    </div>
                </div>
                <div class="post-card-trigger-zone" style="background: linear-gradient(135deg, ${post.cardData.bgColor1}, ${post.cardData.bgColor2});" onclick="openFullscreenCard(${post.id})">
                     <div class="pattern-overlay" id="pattern-container-${post.id}"></div>
                     <button style="pointer-events:none; background:${post.cardData.buttonBgColor}; color:${post.cardData.buttonTextColor}; border:none; padding:10px 20px; border-radius:20px; font-weight:bold; z-index:10;">${post.cardData.buttonText}</button>
                </div>
                <div class="post-actions">
                    <button class="action-btn" onclick="likePostAction(${post.id})">❤️ <span>${post.likes.length}</span></button>
                    <button class="action-btn" onclick="openFullscreenCard(${post.id})">💬 <span>${post.comments.length}</span></button>
                </div>
            </div>
        `;

        // Видимость постов согласно ТЗ
        if(!post.isPrivate || isMe || isAdmin || isMyFriend) {
            feedHTML += postUI;
        }
        adminHTML += postUI;
    });

    feed.innerHTML = feedHTML || '<p style="text-align:center; color:#999;">Лента публичных открыток пуста.</p>';
    if(adminGrid) adminGrid.innerHTML = adminHTML;

    // Отрисовка мини-плиток паттернов для каждого контейнера в ленте
    appState.posts.forEach(post => {
        const block = document.getElementById(`pattern-container-${post.id}`);
        if(block) drawPatternGrid(block, post.cardData);
    });
}

// Открытие модального окна просмотра
window.openFullscreenCard = function(postId) {
    const post = appState.posts.find(p => p.id === postId);
    if(!post) return;

    const modal = document.getElementById('cardModal');
    const stage = document.getElementById('modalCardRenderStage');

    stage.innerHTML = `
        <div style="background: linear-gradient(135deg, ${post.cardData.bgColor1}, ${post.cardData.bgColor2}); padding: 60px 20px; text-align:center; border-radius:8px; position:relative; overflow:hidden;">
             <div class="pattern-overlay" id="modalInternalPattern"></div>
             <button id="modalInternalOpenBtn" class="primary-btn" style="width:auto; position:relative; z-index:10; background:${post.cardData.buttonBgColor}; color:${post.cardData.buttonTextColor};">${post.cardData.buttonText}</button>
             <div id="mText" class="hidden-preview-element" style="color:${post.cardData.textColor}; margin-top:18px; font-weight:${post.cardData.textBold?'bold':'normal'}; text-align:${post.cardData.textCenter?'center':'left'}; font-size:16px;">${post.cardData.text}</div>
             <div id="mStickers" class="hidden-preview-element" style="font-size:22px; margin-top:12px;">${post.cardData.stickers ? post.cardData.stickers.join(' ') : ''}</div>
             <div id="mPhotos" class="hidden-preview-element" style="margin-top:12px;">${post.cardData.photos ? post.cardData.photos.map(src => `<img src="${src}" style="width:${post.cardData.photoSize}px; margin:4px; border-radius:6px;">`).join('') : ''}</div>
             <div id="modalInternalAnimStage"></div>
        </div>
    `;

    drawPatternGrid(document.getElementById('modalInternalPattern'), post.cardData);

    document.getElementById('modalInternalOpenBtn').addEventListener('click', () => {
        executeCardCoreAnimation('modalInternalAnimStage', post.cardData, 'mText', 'mStickers', 'mPhotos');
    });

    renderCommentsList(post);
    modal.style.display = 'flex';
    
    document.getElementById('addCommentForm').style.display = appState.currentUser ? 'flex' : 'none';
    document.getElementById('submitCommentBtn').onclick = () => {
        const inp = document.getElementById('commentTextInput');
        if(inp.value.trim() && appState.currentUser) {
            post.comments.push({ user: appState.currentUser.name, text: inp.value.trim() });
            localStorage.setItem('p_posts', JSON.stringify(appState.posts));
            renderCommentsList(post);
            renderFeed();
            inp.value = '';
        }
    };
};

function renderCommentsList(post) {
    document.getElementById('modalCommentsList').innerHTML = post.comments.map(c => `
        <p><b>${c.user}:</b> ${c.text}</p>
    `).join('');
}

window.likePostAction = function(postId) {
    if(!appState.currentUser) { alert('Лайки доступны только после авторизации!'); return; }
    const post = appState.posts.find(p => p.id === postId);
    const uName = appState.currentUser.name;

    if(post.likes.includes(uName)) {
        post.likes = post.likes.filter(x => x !== uName);
    } else {
        post.likes.push(uName);
    }
    localStorage.setItem('p_posts', JSON.stringify(appState.posts));
    renderFeed();
};

// Система авторизации и управления правами доступа (Роли)
function initAuthEngine() {
    document.getElementById('loginBtn').addEventListener('click', () => {
        const u = document.getElementById('usernameInput').value.trim();
        const p = document.getElementById('passwordInput').value.trim();
        if(appState.usersDB[u] && appState.usersDB[u].password === p) {
            authorizeUserSession(u);
        } else {
            alert('Неверные данные учетной записи!');
        }
    });

    document.getElementById('registerBtn').addEventListener('click', () => {
        const u = document.getElementById('usernameInput').value.trim();
        const p = document.getElementById('passwordInput').value.trim();
        if(!u || !p) return alert('Заполните пустые поля!');
        if(appState.usersDB[u]) return alert('Пользователь уже существует!');

        appState.usersDB[u] = { password: p, role: 'user', friends: [], historyIn: [], historyOut: [] };
        localStorage.setItem('p_users', JSON.stringify(appState.usersDB));
        authorizeUserSession(u);
    });

    document.getElementById('logoutBtn').addEventListener('click', () => {
        appState.currentUser = null;
        document.getElementById('userProfileBlock').style.display = 'none';
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('tabAdminLink').style.display = 'none';
        document.getElementById('sideAdminLink').style.display = 'none';
        document.getElementById('newsAdminPanel').style.display = 'none';
        renderFeed();
    });

    document.getElementById('addFriendBtn').addEventListener('click', () => {
        const target = document.getElementById('friendNameInput').value.trim();
        if(appState.usersDB[target] && target !== appState.currentUser.name) {
            if(!appState.usersDB[appState.currentUser.name].friends.includes(target)) {
                appState.usersDB[appState.currentUser.name].friends.push(target);
                localStorage.setItem('p_users', JSON.stringify(appState.usersDB));
                syncProfileUI();
                renderFeed();
            }
        } else {
            alert('Пользователь не зарегистрирован!');
        }
    });
}

function authorizeUserSession(username) {
    appState.currentUser = { name: username, role: appState.usersDB[username].role };
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('userProfileBlock').style.display = 'block';
    document.getElementById('currentUserName').textContent = username;
    document.getElementById('currentUserRole').textContent = appState.currentUser.role;

    if(appState.currentUser.role === 'admin') {
        document.getElementById('tabAdminLink').style.display = 'block';
        document.getElementById('sideAdminLink').style.display = 'block';
        document.getElementById('newsAdminPanel').style.display = 'block';
        bindAdminControls();
    }
    syncProfileUI();
    renderFeed();
}

// Синхронизация архивов входящих/исходящих историй и списков друзей
function syncProfileUI() {
    const data = appState.usersDB[appState.currentUser.name];
    document.getElementById('friendsList').innerHTML = data.friends.map(f => `<li>👤 ${f}</li>`).join('');

    // Наполнение поповера исходящих
    document.getElementById('historyOutPopover').innerHTML = data.historyOut.length ? data.historyOut.map(id => `
        <div class="popover-item" onclick="openFullscreenCard(${id})">Открытка #${id}</div>
    `).join('') : 'Нет отправленных';

    // Наполнение поповера входящих на основе списка друзей (вычисляется из БД)
    let inboundHTML = '';
    appState.posts.forEach(post => {
        if(data.friends.includes(post.author)) {
            inboundHTML += `<div class="popover-item" onclick="openFullscreenCard(${post.id})">От ${post.author} (${post.date})</div>`;
        }
    });
    document.getElementById('historyInPopover').innerHTML = inboundHTML || 'Входящих архивов нет';
}

// Система Панели Администратора (Для учетной записи qweezer)
function bindAdminControls() {
    document.getElementById('postNewsBtn').onclick = () => {
        const text = document.getElementById('newsText').value.trim();
        if(text) {
            appState.news.unshift({ text: text, date: new Date().toLocaleDateString() });
            localStorage.setItem('p_news', JSON.stringify(appState.news));
            renderNews();
            document.getElementById('newsText').value = '';
            alert('Новость добавлена!');
        }
    };

    document.getElementById('saveAdminLogo').onclick = () => {
        appState.siteSettings.logo = document.getElementById('adminLogoText').value;
        localStorage.setItem('p_settings', JSON.stringify(appState.siteSettings));
        applyGlobalSettings();
        alert('Логотип обновлен!');
    };

    document.getElementById('adminSiteBg').onchange = (e) => {
        if(e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                appState.siteSettings.bg = ev.target.result;
                localStorage.setItem('p_settings', JSON.stringify(appState.siteSettings));
                applyGlobalSettings();
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    document.getElementById('resetAdminBg').onclick = () => {
        appState.siteSettings.bg = '';
        localStorage.setItem('p_settings', JSON.stringify(appState.siteSettings));
        applyGlobalSettings();
    };
}

function renderNews() {
    const container = document.getElementById('newsContainer');
    if(container) container.innerHTML = appState.news.map(n => `
        <div class="news-item">
            <strong>[${n.date}] Оповещение системы:</strong>
            <p>${n.text}</p>
        </div>
    `).join('');
}