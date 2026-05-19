// Ядро базы данных (Single Page Application Architecture)
let appState = {
    user: null,
    db: JSON.parse(localStorage.getItem('pk_v2_users')) || {
        'qweezer': { pass: '123', role: 'admin', friends: [], bio: 'Главный Администратор' }
    },
    posts: JSON.parse(localStorage.getItem('pk_v2_posts')) || [],
    news: JSON.parse(localStorage.getItem('pk_v2_news')) || [],
    suggestions: JSON.parse(localStorage.getItem('pk_v2_sugg')) || [
        { user: 'katya', text: 'Добавьте больше кошачьих каомодзи!' },
        { user: 'danil', text: 'Сайт топ, сделайте тему темнее' }
    ],
    settings: JSON.parse(localStorage.getItem('pk_v2_set')) || {
        logo: '🌸 PinkCards', mainColor: '#faceb1', accentColor: '#ffa58a', bgColor: '#fffcfb', bgImg: ''
    }
};

// Временное состояние сборщика открытки
let cardState = {
    text: 'Поздравляю от всей души! ✨', font: 'font-sans', align: true, bold: false, size: 22, color: '#2c2c2c',
    btnText: 'Нажми меня 💌', btnBg: '#faceb1', btnColor: '#ffffff', btnStyle: 'rounded', btnSize: 16, btnPhoto: null,
    bg1: '#faceb1', bg2: '#ffa58a', pattern: null, pSize: 45, pOp: 35,
    items: [], // Объекты картинок и каомодзи { id, type, content, x, y }
    anim: 'gift'
};

const defaultKaomojis = ["(◕‿◕✿)", "(･θ･)", "(✿◠‿◠)", "ᕕ( ᐛ )ᕗ", "(╭ರ_⊙)", "(•‿•)", "(｡♥‿♥｡)", "(✖╭╮✖)", "¯\\_(ツ)_/¯", "(ง'̀-'́)ง"];

document.addEventListener('DOMContentLoaded', () => {
    applyDesignSettings();
    initCoreUI();
    initEditorEngine();
    renderKaomojis();
    checkParamsRoute();
    updateLivePreview();
});

// Динамическое применение стилей админа
function applyDesignSettings() {
    const s = appState.settings;
    const r = document.documentElement.style;
    r.setProperty('--pink', s.mainColor);
    r.setProperty('--orange', s.accentColor);
    r.setProperty('--bg', s.bgColor);
    
    document.getElementById('siteLogoBtn').textContent = s.logo;
    if(s.bgImg) {
        document.body.style.backgroundImage = `url(${s.bgImg})`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundAttachment = 'fixed';
    } else {
        document.body.style.backgroundImage = 'none';
    }
}

// Регулятор вкладок верхнего уровня
function changeTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-inline-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(tabId + 'Tab')?.classList.add('active');
    document.getElementById('sideMenu').classList.remove('active');
    
    // Подсветка кнопок шапки
    if(['feed','create','news'].includes(tabId)) {
        const btns = document.querySelectorAll('.nav-inline-btn');
        if(tabId==='feed') btns[0].classList.add('active');
        if(tabId==='create') btns[1].classList.add('active');
        if(tabId==='news') btns[2].classList.add('active');
    }

    if(tabId === 'feed') renderFeed();
    if(tabId === 'profile') loadMyProfile();
    if(tabId === 'history') renderHistory();
    if(tabId === 'friends') renderFriendsList();
    if(tabId === 'news') renderNewsFeed();
}

function initCoreUI() {
    document.getElementById('burgerBtn').onclick = () => document.getElementById('sideMenu').classList.add('active');
    document.getElementById('closeMenuBtn').onclick = () => document.getElementById('sideMenu').classList.remove('active');
    
    // Клик на Логотип (Правка 1, 2, 3)
    document.getElementById('siteLogoBtn').onclick = () => {
        const modal = document.getElementById('logoMenuModal');
        const suggRow = document.getElementById('adminSuggestionsRow');
        
        if(appState.user?.role === 'admin') {
            suggRow.style.display = 'block';
            document.getElementById('suggestionsContainer').innerHTML = appState.suggestions.map(s => `<div><b>@${s.user}:</b> ${s.text}</div>`).join('');
        } else {
            suggRow.style.display = 'none';
        }
        modal.style.display = 'flex';
    };

    // Табы внутри конструктора открыток
    document.querySelectorAll('.ed-tab-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.ed-tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.ed-tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.edtab).classList.add('active');
        }
    });

    // Авторизация
    const authHandler = (isRegistering) => {
        const u = document.getElementById('usernameInput').value.trim();
        const p = document.getElementById('passwordInput').value.trim();
        if(!u || !p) return alert('Заполните поля!');
        
        if(isRegistering) {
            if(appState.db[u]) return alert('Этот никнейм уже занят!');
            appState.db[u] = { pass: p, role: 'user', friends: [], bio: '' };
            saveDB();
            alert('Регистрация успешна! Теперь войдите.');
        } else {
            if(!appState.db[u] || appState.db[u].pass !== p) return alert('Неверный логин или пароль!');
            appState.user = { name: u, ...appState.db[u] };
            syncAuthInterface();
            alert(`Добро пожаловать, ${u}!`);
        }
    };
    document.getElementById('loginBtn').onclick = () => authHandler(false);
    document.getElementById('registerBtn').onclick = () => authHandler(true);
    document.getElementById('logoutBtn').onclick = () => { appState.user = null; syncAuthInterface(); changeTab('feed'); };
    
    document.getElementById('userSearchInput').oninput = (e) => renderFeed(e.target.value);
}

function syncAuthInterface() {
    const logged = !!appState.user;
    document.getElementById('authSidebarBlock').style.display = logged ? 'none' : 'block';
    document.getElementById('userProfileSidebarBlock').style.display = logged ? 'block' : 'none';
    document.getElementById('authMenuLinks').style.display = logged ? 'block' : 'none';
    
    if(logged) {
        const name = appState.user.name;
        document.getElementById('sidebarUserName').textContent = name;
        document.getElementById('sidebarUserRole').textContent = appState.user.role;
        
        const avatar = document.getElementById('sidebarLetterAvatar');
        avatar.textContent = name.charAt(0);
        
        if(appState.user.role === 'admin') {
            document.getElementById('adminLink').style.display = 'block';
            document.getElementById('adminNewsBlock').style.display = 'block';
            renderAdminTable();
        }
    } else {
        document.getElementById('adminLink').style.display = 'none';
        document.getElementById('adminNewsBlock').style.display = 'none';
    }
    renderFeed();
}

function renderKaomojis() {
    const container = document.getElementById('kaomojiContainer');
    container.innerHTML = defaultKaomojis.map(k => `<button class="km-btn" onclick="addMovableItem('kaomoji', '${k}')">${k}</button>`).join('');
}

// --- ДВИЖОК РЕДАКТОРА С DRAG AND DROP (Правка 5) ---
function initEditorEngine() {
    const bindEl = (id, key, ev='input', check=false) => {
        document.getElementById(id).addEventListener(ev, e => { cardState[key] = check ? e.target.checked : e.target.value; updateLivePreview(); });
    };
    bindEl('cardText', 'text'); bindEl('cardFont', 'font', 'change'); bindEl('textCenter', 'align', 'change', check=true);
    bindEl('textBold', 'bold', 'change', check=true); bindEl('textSize', 'size'); bindEl('textColor', 'color');
    bindEl('buttonText', 'btnText'); bindEl('buttonStyle', 'buttonStyle', 'change'); bindEl('buttonSize', 'btnSize');
    bindEl('buttonBgColor', 'btnBg'); bindEl('buttonTextColor', 'btnColor'); bindEl('bgColor1', 'bg1');
    bindEl('bgColor2', 'bg2'); bindEl('patternSize', 'pSize'); bindEl('patternOpacity', 'pOp');
    bindEl('animationType', 'anim', 'change');

    // Кастомный эмодзи кнопкой
    document.getElementById('addCustomEmojiBtn').onclick = () => {
        const val = document.getElementById('customEmoji').value.trim();
        if(val) { addMovableItem('kaomoji', val); document.getElementById('customEmoji').value = ''; }
    };

    // Чтение локальных файлов картинок
    const setupFileReader = (inputId, callback) => {
        document.getElementById(inputId).onchange = e => {
            if(e.target.files[0]) {
                const r = new FileReader();
                r.onload = ev => callback(ev.target.result);
                r.readAsDataURL(e.target.files[0]);
            }
        };
    };
    setupFileReader('btnPhotoInput', data => { cardState.btnPhoto = data; updateLivePreview(); });
    setupFileReader('patternInput', data => { cardState.pattern = data; updateLivePreview(); });
    setupFileReader('photoInput', data => addMovableItem('photo', data));

    document.getElementById('photoSizeRange').oninput = (e) => {
        const size = e.target.value;
        document.querySelectorAll('#liveMovableZone .draggable-img').forEach(img => {
            img.style.width = size + 'px';
            const id = img.parentElement.dataset.id;
            const item = cardState.items.find(x => x.id == id);
            if(item) item.size = size;
        });
    };

    // Кнопка публикации
    document.getElementById('publishBtn').onclick = () => {
        const rec = document.getElementById('receiverInput').value.trim();
        const post = {
            id: Date.now(),
            author: appState.user ? appState.user.name : 'Аноним',
            receiver: rec || null,
            date: new Date().toLocaleDateString(),
            likes: [], comments: [],
            isPrivate: document.getElementById('isPrivate').checked,
            data: JSON.parse(JSON.stringify(cardState))
        };
        appState.posts.unshift(post);
        localStorage.setItem('pk_v2_posts', JSON.stringify(appState.posts));
        
        // Автоматическая симуляция предложения на акк админа, если указан админ получателем
        if(rec === 'qweezer') {
            appState.suggestions.push({ user: post.author, text: `Вам направлена открытка №${post.id}` });
            localStorage.setItem('pk_v2_sugg', JSON.stringify(appState.suggestions));
        }

        changeTab('feed');
        alert('Поздравляем! Открытка успешно загружена на платформу.');
    };
}

// Добавление интерактивного перетаскиваемого объекта на сцену
function addMovableItem(type, content) {
    const id = Date.now() + Math.random();
    const size = type === 'photo' ? document.getElementById('photoSizeRange').value : 32;
    cardState.items.push({ id, type, content, x: 25, y: 35, size: size });
    updateLivePreview();
}

function updateLivePreview() {
    const st = cardState;
    const stage = document.getElementById('livePreview');
    stage.style.background = `linear-gradient(135deg, ${st.bg1}, ${st.bg2})`;
    
    drawPatternEngine('livePattern', st);
    
    // Конфигурация Кнопки
    const btn = document.getElementById('liveBtn');
    btn.textContent = st.btnText; btn.style.color = st.btnColor;
    btn.style.fontSize = st.btnSize + 'px';
    btn.style.background = st.btnPhoto ? `url(${st.btnPhoto}) center/cover` : st.btnBg;
    btn.style.padding = '12px 28px';
    btn.className = 'card-action-btn primary-btn ' + (st.buttonStyle === 'glass' ? 'btn-glass' : '');
    btn.style.borderRadius = st.buttonStyle === 'rounded' ? '50px' : '10px';
    btn.style.boxShadow = st.buttonStyle === 'glow' ? `0 0 20px ${st.btnBg}` : 'none';
    btn.style.display = 'inline-block';

    // Конфигурация Скрытого текста
    const txt = document.getElementById('liveText');
    txt.textContent = st.text; txt.style.color = st.color;
    txt.style.fontSize = st.size + 'px';
    txt.className = `card-text ${st.font}`;
    txt.style.textAlign = st.align ? 'center' : 'left';
    txt.style.fontWeight = st.bold ? 'bold' : 'normal';

    // Рендер перетаскиваемых объектов
    const zone = document.getElementById('liveMovableZone');
    zone.innerHTML = '';
    
    st.items.forEach(item => {
        const wrapper = document.createElement('div');
        wrapper.className = 'draggable-item';
        wrapper.dataset.id = item.id;
        wrapper.style.left = item.x + '%';
        wrapper.style.top = item.y + '%';
        
        if(item.type === 'photo') {
            wrapper.innerHTML = `<img src="${item.content}" class="draggable-img" style="width:${item.size}px;">`;
        } else {
            wrapper.innerHTML = `<span class="draggable-emoji">${item.content}</span>`;
        }
        
        // Внедрение Drag and Drop физики
        makeElementDraggable(wrapper, item);
        zone.appendChild(wrapper);
    });
    
    // При вводе сбрасываем состояние
    document.getElementById('liveContent').classList.remove('visible');
    document.getElementById('liveAmbient').classList.remove('active');
}

function makeElementDraggable(el, itemRef) {
    let posX = 0, posY = 0, startX = 0, startY = 0;
    
    const dragStart = (e) => {
        e = e || window.event;
        if(e.type === 'touchstart') {
            startX = e.touches[0].clientX; startY = e.touches[0].clientY;
        } else {
            startX = e.clientX; startY = e.clientY;
        }
        document.onmouseup = dragEnd;
        document.onmousemove = dragElement;
        document.ontouchend = dragEnd;
        document.ontouchmove = dragElement;
    };

    const dragElement = (e) => {
        e = e || window.event;
        let clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
        let clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
        
        posX = startX - clientX; posY = startY - clientY;
        startX = clientX; startY = clientY;
        
        let pHeight = el.parentElement.clientHeight;
        let pWidth = el.parentElement.clientWidth;
        
        let newTopPercent = ((el.offsetTop - posY) / pHeight) * 100;
        let newLeftPercent = ((el.offsetLeft - posX) / pWidth) * 100;
        
        if(newTopPercent >= 0 && newTopPercent <= 90) el.style.top = newTopPercent + "%";
        if(newLeftPercent >= 0 && newLeftPercent <= 90) el.style.left = newLeftPercent + "%";
    };

    const dragEnd = () => {
        document.onmouseup = null; document.onmousemove = null;
        document.ontouchend = null; document.ontouchmove = null;
        // Сохраняем финальные координаты в стейт
        itemRef.x = parseFloat(el.style.left);
        itemRef.y = parseFloat(el.style.top);
    };

    el.onmousedown = dragStart;
    el.ontouchstart = dragStart;
}

function drawPatternEngine(targetId, state) {
    const c = document.getElementById(targetId); if(!c) return;
    c.innerHTML = ''; if(!state.pattern) return;
    const count = 35;
    for(let i=0; i<count; i++) {
        const img = document.createElement('img'); img.src = state.pattern;
        img.style.cssText = `position:absolute; width:${state.pSize}px; height:${state.pSize}px; opacity:${state.pOp/100}; left:${(i%7)*(100/6)}%; top:${Math.floor(i/7)*70}px; transform:rotate(${(i*13)%45}deg);`;
        c.appendChild(img);
    }
}

// --- СВЕРХТОЧНЫЙ ВОСПРОИЗВОДЯЩИЙ ДВИЖОК АНИМАЦИЙ (Правка 6) ---
document.getElementById('liveBtn').onclick = () => runAnimationEngine('live', cardState);

function runAnimationEngine(pfx, state) {
    document.getElementById(`${pfx}Btn`).style.display = 'none';
    const contentBox = document.getElementById(`${pfx}Content`);
    contentBox.classList.add('visible');
    
    // Эффект окружения
    const amb = document.getElementById(`${pfx}Ambient`);
    amb.innerHTML = ''; amb.classList.add('active');
    
    state.items.filter(x => x.type === 'kaomoji').forEach(k => {
        const sp = document.createElement('span'); sp.className = 'ambient-emoji'; sp.textContent = k.content;
        sp.style.left = k.x + '%'; sp.style.top = k.y + '%';
        amb.appendChild(sp);
    });

    // Отрендерить медиафайлы статично во время воспроизведения
    if(pfx === 'modal') {
        const zone = document.getElementById('modalMovableZone'); zone.innerHTML = '';
        state.items.forEach(item => {
            const el = document.createElement('div'); el.className = 'draggable-item';
            el.style.left = item.x+'%'; el.style.top = item.y+'%';
            el.innerHTML = item.type==='photo' ? `<img src="${item.content}" style="width:${item.size}px; border-radius:8px;">` : `<span style="font-size:24px;">${item.content}</span>`;
            zone.appendChild(el);
        });
    }

    // Режимы частиц
    const anim = document.getElementById(`${pfx}Anim`); anim.innerHTML = '';
    const fxMap = { gift: '🎉', poop: '💩', bouquet: '🌸', fart: '💨' };
    const curFx = fxMap[state.anim] || '✨';

    if(['gift','poop','fall'].includes(state.anim)) {
        const obj = document.createElement('div'); obj.className = 'falling-obj';
        obj.textContent = state.anim === 'gift' ? '🎁' : state.anim === 'poop' ? '💩' : '📦';
        obj.classList.add(state.anim === 'gift' ? 'fall-gift-anim' : state.anim === 'poop' ? 'fall-poop-anim' : 'fall-shake-anim');
        anim.appendChild(obj);
    }

    // Каскадный выброс
    setTimeout(() => {
        for(let i=0; i<30; i++) {
            const p = document.createElement('div'); p.className = 'particle'; p.textContent = curFx;
            p.style.left = '50%'; p.style.top = '40%';
            p.style.setProperty('--dx', `${(Math.random() - 0.5) * 280}px`);
            p.style.setProperty('--dy', `${(Math.random() - 0.5) * 280}px`);
            anim.appendChild(p);
        }
    }, state.anim === 'poop' ? 650 : 100);

    // ПОЛНОЕ ИСЧЕЗНОВЕНИЕ ИЗ DOM-ДЕРЕВА ЧЕРЕЗ 2.5 СЕКУНДЫ
    setTimeout(() => { anim.innerHTML = ''; }, 2500);
}

// --- ЛЕНТА И СОЦИАЛЬНЫЙ ФУНКЦИОНАЛ ---
function createPostBlock(p) {
    const me = appState.user?.name;
    const isOwner = me === p.author;
    const isAdmin = appState.user?.role === 'admin';
    const hasLiked = p.likes.includes(me);
    
    // Логика базовых аватарок по первой букве (Правка 3)
    const letter = p.author.charAt(0).toUpperCase();

    let controlBar = '';
    if(isOwner) {
        controlBar = `<button class="secondary-btn" style="width:auto; padding:4px 12px; font-size:11px;" onclick="switchPostPrivacy(${p.id})">${p.isPrivate?'Сделать Публичной 🔓':'Сделать Приватной 🔒'}</button> <button class="secondary-btn" style="width:auto; padding:4px 12px; font-size:11px; color:red;" onclick="removePost(${p.id})">🗑 Удалить</button>`;
    } else if(isAdmin) {
        controlBar = `<button class="secondary-btn" style="width:auto; padding:4px 12px; font-size:11px; color:red;" onclick="removePost(${p.id})">🛠 Админ-Удаление</button>`;
    }

    return `
        <div class="post-card">
            <div class="post-header" onclick="viewUserProfile('${p.author}')">
                <div class="letter-avatar">${letter}</div>
                <div><b>${p.author}</b> ${p.isPrivate?'🔒 Приватная':''} ${p.receiver?`➡️ для @${p.receiver}`:''}<br><small>${p.date}</small></div>
            </div>
            <div class="card-stage" style="background:linear-gradient(135deg, ${p.data.bg1}, ${p.data.bg2})" onclick="openCardModal(${p.id})">
                <div id="feed-patt-${p.id}" class="pattern-layer"></div>
                <button class="card-action-btn primary-btn" style="pointer-events:none; background:${p.data.btnBg}; color:${p.data.btnColor}; font-size:13px; padding:6px 16px;">${p.data.btnText}</button>
            </div>
            <div class="post-actions">
                <button class="icon-btn" onclick="likePost(${p.id})">${hasLiked?'❤️':'🤍'} ${p.likes.length}</button>
                <button class="icon-btn" onclick="openCardModal(${p.id})">💬 ${p.comments.length}</button>
                <button class="icon-btn" onclick="copyCardLink(${p.id})">🔗 Ссылка</button>
            </div>
            ${controlBar ? `<div style="padding:8px 20px; background:#fffbfb; border-top:1px solid #fff0ec; text-align:right;">${controlBar}</div>` : ''}
        </div>
    `;
}

function renderFeed(filterQuery = '') {
    const f = document.getElementById('instagramFeed'); if(!f) return;
    let code = '';
    
    appState.posts.forEach(p => {
        // qweezer (Администратор) видит вообще все открытки без исключения! (Правка 4)
        const isViewableByAdmin = appState.user?.role === 'admin';
        const isMyPost = appState.user && p.author === appState.user.name;
        const isForMe = appState.user && p.receiver === appState.user.name;
        
        if(!p.isPrivate || isViewableByAdmin || isMyPost || isForMe) {
            if(p.author.toLowerCase().includes(filterQuery.toLowerCase())) {
                code += createPostBlock(p);
            }
        }
    });
    
    f.innerHTML = code || '<p style="text-align:center; padding:20px; color:#999;">В ленте пустует...</p>';
    appState.posts.forEach(p => { drawPatternEngine(`feed-patt-${p.id}`, p.data); });
}

// --- ОКНО ПРОСМОТРА ОТКРЫТКИ ---
window.openCardModal = function(id) {
    const p = appState.posts.find(x => x.id === id); if(!p) return alert('Объект не найден');
    const m = document.getElementById('cardModal');
    
    // Сброс анимаций
    document.getElementById('modalBtn').style.display = 'inline-block';
    document.getElementById('modalContent').classList.remove('visible');
    document.getElementById('modalAmbient').classList.remove('active');
    
    const st = p.data;
    document.getElementById('modalStage').style.background = `linear-gradient(135deg, ${st.bg1}, ${st.bg2})`;
    drawPatternEngine('modalPattern', st);
    
    const btn = document.getElementById('modalBtn');
    btn.textContent = st.btnText; btn.style.color = st.btnColor;
    btn.style.background = st.btnPhoto ? `url(${st.btnPhoto}) center/cover` : st.btnBg;
    btn.className = 'card-action-btn primary-btn ' + (st.buttonStyle==='glass'?'btn-glass':'');
    btn.style.borderRadius = st.buttonStyle==='rounded'?'50px':'10px';

    const txt = document.getElementById('modalText');
    txt.textContent = st.text; txt.style.color = st.color; txt.className = `card-text ${st.font}`;
    txt.style.textAlign = st.align ? 'center' : 'left'; txt.style.fontWeight = st.bold ? 'bold' : 'normal';

    btn.onclick = () => runAnimationEngine('modal', st);
    
    // Нагрузка комментариев
    document.getElementById('commentsList').innerHTML = p.comments.map(c => `<div><b>${c.user}:</b> ${c.text}</div>`).join('');
    document.getElementById('commentForm').style.display = appState.user ? 'flex' : 'none';
    
    document.getElementById('sendCommentBtn').onclick = () => {
        const val = document.getElementById('commentText').value.trim();
        if(val && appState.user) {
            p.comments.push({ user: appState.user.name, text: val });
            localStorage.setItem('pk_v2_posts', JSON.stringify(appState.posts));
            openCardModal(id);
            document.getElementById('commentText').value = '';
        }
    };
    m.style.display = 'flex';
};

document.getElementById('closeCardModalBtn').onclick = () => document.getElementById('cardModal').style.display = 'none';

// --- СИСТЕМА ВХОДЯЩИХ И ИСХОДЯЩИХ ---
function renderHistory() {
    if(!appState.user) return;
    const name = appState.user.name;
    
    const incZone = document.getElementById('incomingCards');
    const outZone = document.getElementById('outgoingCards');
    
    const incoming = appState.posts.filter(p => p.receiver === name);
    const outgoing = appState.posts.filter(p => p.author === name && p.receiver !== null);
    
    document.getElementById('incomingCount').textContent = incoming.length;
    document.getElementById('outgoingCount').textContent = outgoing.length;

    const mapper = list => list.map(p => `<div class="sidebar-box flex-row" style="justify-content:space-between; margin-bottom:8px; padding:12px;"><span><b>От:</b> ${p.author} (${p.date})</span><button class="primary-btn" style="width:auto; padding:6px 14px;" onclick="openCardModal(${p.id})">Просмотр</button></div>`).join('');
    
    incZone.innerHTML = mapper(incoming) || '<p class="hint-text">Входящих пакетов не обнаружено</p>';
    outZone.innerHTML = mapper(outgoing) || '<p class="hint-text">Вы еще ничего не отправляли лично</p>';
}

// --- ПРОФИЛИ ---
window.viewUserProfile = function(name) {
    const u = appState.db[name]; if(!u) return;
    document.getElementById('viewUserLetterAvatar').textContent = name.charAt(0);
    document.getElementById('viewUsername').textContent = name;
    document.getElementById('viewBio').textContent = u.bio || 'Пользователь не оставил заметок о себе.';
    
    let html = '';
    appState.posts.filter(p => p.author === name && !p.isPrivate).forEach(p => html += createPostBlock(p));
    document.getElementById('viewUserFeed').innerHTML = html || '<p>У пользователя нет публичных открыток.</p>';
    
    changeTab('viewUser');
};

function loadMyProfile() {
    if(!appState.user) return;
    document.getElementById('myLetterAvatar').textContent = appState.user.name.charAt(0);
    document.getElementById('myUsername').textContent = appState.user.name;
    document.getElementById('myBio').textContent = appState.user.bio || 'Биография отсутствует';
    document.getElementById('editBio').value = appState.user.bio || '';
    
    document.getElementById('saveProfileBtn').onclick = () => {
        const bio = document.getElementById('editBio').value;
        appState.user.bio = bio;
        appState.db[appState.user.name].bio = bio;
        saveDB(); syncAuthInterface(); loadMyProfile();
        alert('Данные обновлены!');
    };
}

// --- УТИЛИТАРНЫЕ СВЯЗИ ---
window.likePost = id => { if(!appState.user) return alert('Только авторизованные пользователи могут ставить лайки!'); const p=appState.posts.find(x=>x.id===id); p.likes.includes(appState.user.name) ? p.likes=p.likes.filter(x=>x!==appState.user.name) : p.likes.push(appState.user.name); localStorage.setItem('pk_v2_posts', JSON.stringify(appState.posts)); renderFeed(); };
window.removePost = id => { if(confirm('Удалить открытку безвозвратно?')) { appState.posts = appState.posts.filter(x=>x.id!==id); localStorage.setItem('pk_v2_posts', JSON.stringify(appState.posts)); renderFeed(); } };
window.switchPostPrivacy = id => { const p=appState.posts.find(x=>x.id===id); p.isPrivate = !p.isPrivate; localStorage.setItem('pk_v2_posts', JSON.stringify(appState.posts)); renderFeed(); };
window.copyCardLink = id => { const link = window.location.origin + window.location.pathname + '?card=' + id; navigator.clipboard.writeText(link); alert('Уникальный URL скопирован в буфер обмена!'); };
window.closeModal = id => document.getElementById(id).style.display = 'none';

function saveDB() { localStorage.setItem('pk_v2_users', JSON.stringify(appState.db)); }

// --- УПРАВЛЕНИЕ АДМИНИСТРАТОРА (qweezer) ---
function renderAdminTable() {
    let rows = '';
    for(let login in appState.db) {
        rows += `<tr><td><b>@${login}</b></td><td style="font-family:monospace; color:red;">${appState.db[login].pass}</td><td><span class="role-badge">${appState.db[login].role}</span></td></tr>`;
    }
    document.getElementById('adminUserTable').innerHTML = rows;
}

document.getElementById('saveGlobalSettings').onclick = () => {
    const s = appState.settings;
    s.mainColor = document.getElementById('admMainColor').value;
    s.accentColor = document.getElementById('admAccentColor').value;
    s.bgColor = document.getElementById('admBgColor').value;
    s.logo = document.getElementById('globalLogo').value || '🌸 PinkCards';

    const bgFile = document.getElementById('globalBg').files[0];
    if(bgFile) {
        const r = new FileReader();
        r.onload = e => { s.bgImg = e.target.result; saveSettingsObj(); };
        r.readAsDataURL(bgFile);
    } else {
        saveSettingsObj();
    }
};

function saveSettingsObj() {
    localStorage.setItem('pk_v2_set', JSON.stringify(appState.settings));
    applyDesignSettings();
    alert('Глобальная визуальная тема изменена!');
}

function renderNewsFeed() { document.getElementById('newsList').innerHTML = appState.news.map(n => `<div class="sidebar-box"><small style="color:var(--orange)"><b>${n.date}</b></small><p style="margin-top:6px;">${n.text}</p></div>`).join(''); }
document.getElementById('postNewsBtn').onclick = () => { const t=document.getElementById('newsInput').value.trim(); if(t){ appState.news.unshift({date:new Date().toLocaleDateString(), text:t}); localStorage.setItem('pk_v2_news', JSON.stringify(appState.news)); renderNewsFeed(); document.getElementById('newsInput').value=''; } };
function renderFriendsList() { document.getElementById('friendsList').innerHTML = (appState.user?.friends || []).map(f => `<li><a href="#" onclick="viewUserProfile('${f}')">@${f}</a></li>`).join(''); }
document.getElementById('addFriendBtn').onclick = () => { const f=document.getElementById('friendSearch').value.trim(); if(appState.db[f] && f!==appState.user.name){ appState.user.friends.push(f); appState.db[appState.user.name].friends = appState.user.friends; saveDB(); renderFriendsList(); document.getElementById('friendSearch').value=''; } else alert('Пользователь не найден!'); };

function checkParamsRoute() {
    const p = new URLSearchParams(window.location.search);
    if(p.get('card')) { setTimeout(() => openCardModal(parseInt(p.get('card'))), 400); }
}