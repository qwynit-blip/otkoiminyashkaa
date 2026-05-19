/**
 * ГЛОБАЛЬНАЯ КЛИЕНТ-СЕРВЕРНАЯ АРХИТЕКТУРА (0_0)otkoiminyashkaa
 * Для обеспечения работы соцсети на ВСЕХ устройствах одновременно, 
 * используется облачное синхронизированное REST-хранилище (jsonbin API).
 */

const CLOUD_BIN_URL = "https://api.jsonbin.io/v3/b/6649fdece41b4d34e4956272";
// Публичный мастер-ключ для чтения/записи глобальной структуры всеми пользователями
const CLOUD_HEADERS = {
    "Content-Type": "application/json",
    "X-Master-Key": "$2a$10$WpMhKOfs0U5f.qNHeL20I.WnCgqL6b6Sg49GHeX8k6eM7Pj77yHeO" 
};

// Системный стейт по умолчанию
let appState = {
    user: null,
    db: {
        'qweezer': { pass: '123', role: 'admin', friends: [], bio: 'Главный Администратор Сети' }
    },
    posts: [],
    news: [],
    suggestions: [
        { user: 'Аноним', text: 'Проект супер! Имя (0_0)otkoiminyashkaa просто бомба!' }
    ],
    settings: {
        logo: '(0_0)otkoiminyashkaa', mainColor: '#faceb1', accentColor: '#ffa58a', bgColor: '#fffcfb', 
        bgImg: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=1920&auto=format&fit=crop'
    }
};

let cardState = {
    text: 'Поздравляю от всей души! ✨', font: 'font-sans', align: true, bold: false, size: 22, color: '#2c2c2c',
    btnText: 'Открыть открытку 💌', btnBg: '#faceb1', btnColor: '#ffffff', btnStyle: 'rounded', btnSize: 16, btnPhoto: null,
    bg1: '#faceb1', bg2: '#ffa58a', pattern: null, pSize: 45, pOp: 35,
    items: [],
    anim: 'gift'
};

const defaultKaomojis = ["(0_0)", "(◕‿◕✿)", "(･θ･)", "(✿◠‿◠)", "ᕕ( ᐛ )ᕗ", "(╭ರ_⊙)", "(•‿•)", "(｡♥‿♥｡)", "¯\\_(ツ)_/¯"];

document.addEventListener('DOMContentLoaded', async () => {
    initCoreUI();
    initEditorEngine();
    renderKaomojis();
    
    // Первичный запуск — стягиваем данные из глобального облака (Правка 3 и 5)
    await syncWithCloud(true); 
    updateLivePreview();
    checkParamsRoute();
});

// Синхронизация данных с сервером (REST API Engine)
async function syncWithCloud(isDownloading = true) {
    try {
        if (isDownloading) {
            // Скачиваем актуальную общую базу (открытки, настройки админа, новости со всех устройств)
            const response = await fetch(`${CLOUD_BIN_URL}/latest`, { method: "GET", headers: CLOUD_HEADERS });
            if(response.ok) {
                const cloudData = await response.json();
                if(cloudData.record) {
                    appState.db = cloudData.record.db || appState.db;
                    appState.posts = cloudData.record.posts || [];
                    appState.news = cloudData.record.news || [];
                    appState.suggestions = cloudData.record.suggestions || [];
                    appState.settings = cloudData.record.settings || appState.settings;
                }
            }
        } else {
            // Выгружаем локальные изменения в облако, чтобы их увидели ВСЕ девайсы
            await fetch(CLOUD_BIN_URL, {
                method: "PUT",
                headers: CLOUD_HEADERS,
                body: JSON.stringify({
                    db: appState.db, posts: appState.posts, news: appState.news, 
                    suggestions: appState.suggestions, settings: appState.settings
                })
            });
        }
    } catch (e) {
        console.log("Режим автономного локального кэша запущен: ", e);
    }
    applyDesignSettings();
    renderFeed();
}

// Применение настроек админа НА ВСЕХ УСТРОЙСТВАХ (Правка 5)
function applyDesignSettings() {
    const s = appState.settings;
    const r = document.documentElement.style;
    r.setProperty('--pink', s.mainColor);
    r.setProperty('--orange', s.accentColor);
    r.setProperty('--bg', s.bgColor);
    
    document.getElementById('siteLogoBtn').textContent = s.logo;
    
    // Меняем фон всего сайта на фото (Правка 1)
    if(s.bgImg) {
        document.body.style.backgroundImage = `url(${s.bgImg})`;
    }
}

function changeTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-inline-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(tabId + 'Tab')?.classList.add('active');
    document.getElementById('sideMenu').classList.remove('active');
    
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
    
    // Клик на логотип
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

    // Вход/Регистрация
    const authHandler = async (isRegistering) => {
        const u = document.getElementById('usernameInput').value.trim();
        const p = document.getElementById('passwordInput').value.trim();
        if(!u || !p) return alert('Введите данные!');
        
        await syncWithCloud(true); // Запрашиваем актуальный список юзеров
        
        if(isRegistering) {
            if(appState.db[u]) return alert('Никнейм занят!');
            appState.db[u] = { pass: p, role: 'user', friends: [], bio: '' };
            await syncWithCloud(false);
            alert('Регистрация в общей сети успешна!');
        } else {
            if(!appState.db[u] || appState.db[u].pass !== p) return alert('Ошибка авторизации!');
            appState.user = { name: u, ...appState.db[u] };
            syncAuthInterface();
            alert(`Добро пожаловать в сеть, ${u}!`);
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
        document.getElementById('sidebarLetterAvatar').textContent = name.charAt(0);
        
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
    document.getElementById('kaomojiContainer').innerHTML = defaultKaomojis.map(k => `<button class="km-btn" onclick="addMovableItem('kaomoji', '${k}')">${k}</button>`).join('');
}

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

    document.getElementById('addCustomEmojiBtn').onclick = () => {
        const val = document.getElementById('customEmoji').value.trim();
        if(val) { addMovableItem('kaomoji', val); document.getElementById('customEmoji').value = ''; }
    };

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

    // Кнопка публикации в облако
    document.getElementById('publishBtn').onclick = async () => {
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
        
        await syncWithCloud(true); // Забираем данные перед пушем
        appState.posts.unshift(post);
        
        if(rec === 'qweezer') {
            appState.suggestions.push({ user: post.author, text: `Направлена открытка №${post.id}` });
        }

        await syncWithCloud(false); // Отправляем в общую сеть
        changeTab('feed');
        alert('Успешно опубликовано в глобальной ленте социальной сети!');
    };
}

function addMovableItem(type, content) {
    const id = Date.now() + Math.random();
    const size = type === 'photo' ? document.getElementById('photoSizeRange').value : 32;
    cardState.items.push({ id, type, content, x: 30, y: 35, size: size });
    updateLivePreview();
}

function updateLivePreview() {
    const st = cardState;
    const stage = document.getElementById('livePreview');
    stage.style.background = `linear-gradient(135deg, ${st.bg1}, ${st.bg2})`;
    
    drawPatternEngine('livePattern', st);
    
    const btn = document.getElementById('liveBtn');
    btn.textContent = st.btnText; btn.style.color = st.btnColor;
    btn.style.fontSize = st.btnSize + 'px';
    btn.style.background = st.btnPhoto ? `url(${st.btnPhoto}) center/cover` : st.btnBg;
    btn.className = 'card-action-btn primary-btn ' + (st.buttonStyle === 'glass' ? 'btn-glass' : '');
    btn.style.borderRadius = st.buttonStyle === 'rounded' ? '50px' : '10px';
    btn.style.boxShadow = st.buttonStyle === 'glow' ? `0 0 20px ${st.btnBg}` : 'none';

    const txt = document.getElementById('liveText');
    txt.textContent = st.text; txt.style.color = st.color; txt.style.fontSize = st.size + 'px';
    txt.className = `card-text ${st.font}`;
    txt.style.textAlign = st.align ? 'center' : 'left';
    txt.style.fontWeight = st.bold ? 'bold' : 'normal';

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
        
        makeElementDraggable(wrapper, item);
        zone.appendChild(wrapper);
    });
}

function makeElementDraggable(el, itemRef) {
    let posX = 0, posY = 0, startX = 0, startY = 0;
    const dragStart = (e) => {
        e = e || window.event;
        startX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
        startY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
        document.onmouseup = dragEnd; document.onmousemove = dragElement;
        document.ontouchend = dragEnd; document.ontouchmove = dragElement;
    };
    const dragElement = (e) => {
        e = e || window.event;
        let clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
        let clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
        posX = startX - clientX; posY = startY - clientY;
        startX = clientX; startY = clientY;
        let nTop = ((el.offsetTop - posY) / el.parentElement.clientHeight) * 100;
        let nLeft = ((el.offsetLeft - posX) / el.parentElement.clientWidth) * 100;
        if(nTop >= 0 && nTop <= 90) el.style.top = nTop + "%";
        if(nLeft >= 0 && nLeft <= 90) el.style.left = nLeft + "%";
    };
    const dragEnd = () => {
        document.onmouseup = null; document.onmousemove = null;
        document.ontouchend = null; document.ontouchmove = null;
        itemRef.x = parseFloat(el.style.left); itemRef.y = parseFloat(el.style.top);
    };
    el.onmousedown = dragStart; el.ontouchstart = dragStart;
}

function drawPatternEngine(targetId, state) {
    const c = document.getElementById(targetId); if(!c || !state.pattern) return;
    c.innerHTML = '';
    for(let i=0; i<24; i++) {
        const img = document.createElement('img'); img.src = state.pattern;
        img.style.cssText = `position:absolute; width:${state.pSize}px; height:${state.pSize}px; opacity:${state.pOp/100}; left:${(i%6)*(100/5)}%; top:${Math.floor(i/6)*80}px;`;
        c.appendChild(img);
    }
}

function runAnimationEngine(pfx, state) {
    document.getElementById(`${pfx}Btn`).style.display = 'none';
    document.getElementById(`${pfx}Content`).classList.add('visible');
    const amb = document.getElementById(`${pfx}Ambient`);
    amb.innerHTML = ''; amb.classList.add('active');
    
    state.items.filter(x => x.type === 'kaomoji').forEach(k => {
        const sp = document.createElement('span'); sp.className = 'ambient-emoji'; sp.textContent = k.content;
        sp.style.left = k.x + '%'; sp.style.top = k.y + '%';
        amb.appendChild(sp);
    });

    if(pfx === 'modal') {
        const zone = document.getElementById('modalMovableZone'); zone.innerHTML = '';
        state.items.forEach(item => {
            const el = document.createElement('div'); el.className = 'draggable-item';
            el.style.left = item.x+'%'; el.style.top = item.y+'%';
            el.innerHTML = item.type==='photo' ? `<img src="${item.content}" style="width:${item.size}px;">` : `<span>${item.content}</span>`;
            zone.appendChild(el);
        });
    }

    const anim = document.getElementById(`${pfx}Anim`); anim.innerHTML = '';
    const fxMap = { gift: '🎉', poop: '💩', bouquet: '🌸', fart: '💨' };
    const curFx = fxMap[state.anim] || '✨';

    if(['gift','poop','fall'].includes(state.anim)) {
        const obj = document.createElement('div'); obj.className = 'falling-obj';
        obj.textContent = state.anim === 'gift' ? '🎁' : state.anim === 'poop' ? '💩' : '📦';
        obj.classList.add(state.anim === 'gift' ? 'fall-gift-anim' : state.anim === 'poop' ? 'fall-poop-anim' : 'fall-shake-anim');
        anim.appendChild(obj);
    }

    setTimeout(() => {
        for(let i=0; i<25; i++) {
            const p = document.createElement('div'); p.className = 'particle'; p.textContent = curFx;
            p.style.left = '50%'; p.style.top = '45%';
            p.style.setProperty('--dx', `${(Math.random() - 0.5) * 250}px`);
            p.style.setProperty('--dy', `${(Math.random() - 0.5) * 250}px`);
            anim.appendChild(p);
        }
    }, state.anim === 'poop' ? 600 : 100);
}

function renderFeed(filterQuery = '') {
    const f = document.getElementById('instagramFeed'); if(!f) return;
    let code = '';
    
    appState.posts.forEach(p => {
        const isAdmin = appState.user?.role === 'admin';
        const isMyPost = appState.user && p.author === appState.user.name;
        const isForMe = appState.user && p.receiver === appState.user.name;
        
        if(!p.isPrivate || isAdmin || isMyPost || isForMe) {
            if(p.author.toLowerCase().includes(filterQuery.toLowerCase())) {
                const letter = p.author.charAt(0).toUpperCase();
                let btns = (isMyPost || isAdmin) ? `<button class="secondary-btn" style="width:auto; padding:4px 8px; font-size:11px;" onclick="removePost(${p.id})">🗑 Удалить</button>` : '';
                
                code += `
                    <div class="post-card">
                        <div class="post-header" onclick="viewUserProfile('${p.author}')">
                            <div class="letter-avatar">${letter}</div>
                            <div><b>${p.author}</b> ${p.isPrivate?'🔒 Приват':''} ${p.receiver?`➡️ @${p.receiver}`:''}<br><small>${p.date}</small></div>
                        </div>
                        <div class="card-stage" style="background:linear-gradient(135deg, ${p.data.bg1}, ${p.data.bg2})" onclick="openCardModal(${p.id})">
                            <div id="feed-patt-${p.id}" class="pattern-layer"></div>
                            <button class="card-action-btn primary-btn" style="pointer-events:none; background:${p.data.btnBg}; color:${p.data.btnColor}; font-size:13px; padding:4px 12px;">${p.data.btnText}</button>
                        </div>
                        <div class="post-actions">
                            <button class="icon-btn" onclick="likePost(${p.id})">${p.likes.includes(appState.user?.name)?'❤️':'🤍'} ${p.likes.length}</button>
                            <button class="icon-btn" onclick="openCardModal(${p.id})">💬 ${p.comments.length}</button>
                        </div>
                        ${btns ? `<div style="padding:6px; background:#fff; text-align:right;">${btns}</div>`:''}
                    </div>
                `;
            }
        }
    });
    f.innerHTML = code || '<p style="text-align:center; padding:20px; color:#fff; text-shadow:1px 1px 2px #000;">Сеть открыток пуста...</p>';
    appState.posts.forEach(p => { drawPatternEngine(`feed-patt-${p.id}`, p.data); });
}

window.openCardModal = function(id) {
    const p = appState.posts.find(x => x.id === id); if(!p) return;
    const m = document.getElementById('cardModal');
    document.getElementById('modalBtn').style.display = 'inline-block';
    document.getElementById('modalContent').classList.remove('visible');
    
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

    btn.onclick = () => runAnimationEngine('modal', st);
    document.getElementById('commentsList').innerHTML = p.comments.map(c => `<div><b>${c.user}:</b> ${c.text}</div>`).join('');
    document.getElementById('commentForm').style.display = appState.user ? 'flex' : 'none';
    
    document.getElementById('sendCommentBtn').onclick = async () => {
        const val = document.getElementById('commentText').value.trim();
        if(val && appState.user) {
            p.comments.push({ user: appState.user.name, text: val });
            await syncWithCloud(false);
            openCardModal(id);
            document.getElementById('commentText').value = '';
        }
    };
    m.style.display = 'flex';
};

document.getElementById('closeCardModalBtn').onclick = () => document.getElementById('cardModal').style.display = 'none';

function renderHistory() {
    if(!appState.user) return;
    const incZone = document.getElementById('incomingCards');
    const outZone = document.getElementById('outgoingCards');
    const incoming = appState.posts.filter(p => p.receiver === appState.user.name);
    const outgoing = appState.posts.filter(p => p.author === appState.user.name && p.receiver !== null);
    
    document.getElementById('incomingCount').textContent = incoming.length;
    document.getElementById('outgoingCount').textContent = outgoing.length;

    const mapper = list => list.map(p => `<div class="sidebar-box flex-row" style="justify-content:space-between; padding:10px; margin-bottom:4px;"><span><b>От:</b> ${p.author}</span><button class="primary-btn" style="width:auto; padding:4px 10px;" onclick="openCardModal(${p.id})">Смотреть</button></div>`).join('');
    incZone.innerHTML = mapper(incoming) || '<p class="hint-text">Нет писем</p>';
    outZone.innerHTML = mapper(outgoing) || '<p class="hint-text">Нет писем</p>';
}

window.viewUserProfile = function(name) {
    const u = appState.db[name]; if(!u) return;
    document.getElementById('viewUserLetterAvatar').textContent = name.charAt(0);
    document.getElementById('viewUsername').textContent = name;
    document.getElementById('viewBio').textContent = u.bio || 'Участник сети.';
    let html = '';
    appState.posts.filter(p => p.author === name && !p.isPrivate).forEach(p => html += createPostBlock(p));
    document.getElementById('viewUserFeed').innerHTML = html || '<p>Лента пуста</p>';
    changeTab('viewUser');
};

function loadMyProfile() {
    if(!appState.user) return;
    document.getElementById('myLetterAvatar').textContent = appState.user.name.charAt(0);
    document.getElementById('myUsername').textContent = appState.user.name;
    document.getElementById('myBio').textContent = appState.user.bio || 'Запись отсутствует';
    document.getElementById('editBio').value = appState.user.bio || '';
    
    document.getElementById('saveProfileBtn').onclick = async () => {
        appState.db[appState.user.name].bio = document.getElementById('editBio').value;
        await syncWithCloud(false);
        alert('Сохранено в облаке!');
    };
}

window.likePost = async id => { if(!appState.user) return alert('Нужен вход!'); const p=appState.posts.find(x=>x.id===id); p.likes.includes(appState.user.name)?p.likes=p.likes.filter(x=>x!==appState.user.name):p.likes.push(appState.user.name); await syncWithCloud(false); };
window.removePost = async id => { if(confirm('Удалить открытку?')) { appState.posts=appState.posts.filter(x=>x.id!==id); await syncWithCloud(false); } };
window.closeModal = id => document.getElementById(id).style.display = 'none';

function renderAdminTable() {
    let rows = '';
    for(let login in appState.db) {
        rows += `<tr><td><b>@${login}</b></td><td style="color:red;">${appState.db[login].pass}</td><td>${appState.db[login].role}</td></tr>`;
    }
    document.getElementById('adminUserTable').innerHTML = rows;
}

// Изменение глобального дизайна админом для ВСЕХ в реальном времени (Правка 5)
document.getElementById('saveGlobalSettings').onclick = async () => {
    const s = appState.settings;
    s.mainColor = document.getElementById('admMainColor').value;
    s.accentColor = document.getElementById('admAccentColor').value;
    s.bgColor = document.getElementById('admBgColor').value;
    s.logo = document.getElementById('globalLogo').value || '(0_0)otkoiminyashkaa';
    
    // Прямая ссылка на фото фона (Правка 1)
    const urlBg = document.getElementById('globalBgUrl').value.trim();
    if(urlBg) s.bgImg = urlBg;

    await syncWithCloud(false); // Отправляем новый дизайн на сервер
    applyDesignSettings();
    alert('Новый дизайн успешно применен для ВСЕХ устройств в сети!');
};

function renderNewsFeed() { document.getElementById('newsList').innerHTML = appState.news.map(n => `<div class="sidebar-box"><small><b>${n.date}</b></small><p style="margin-top:4px;">${n.text}</p></div>`).join(''); }
document.getElementById('postNewsBtn').onclick = async () => { const t=document.getElementById('newsInput').value.trim(); if(t){ appState.news.unshift({date:new Date().toLocaleDateString(), text:t}); await syncWithCloud(false); renderNewsFeed(); document.getElementById('newsInput').value=''; } };
function renderFriendsList() { document.getElementById('friendsList').innerHTML = (appState.user?.friends || []).map(f => `<li><a href="#" onclick="viewUserProfile('${f}')">@${f}</a></li>`).join(''); }
document.getElementById('addFriendBtn').onclick = async () => { const f=document.getElementById('friendSearch').value.trim(); if(appState.db[f] && f!==appState.user.name){ appState.user.friends.push(f); appState.db[appState.user.name].friends = appState.user.friends; await syncWithCloud(false); renderFriendsList(); document.getElementById('friendSearch').value=''; } };

function checkParamsRoute() {
    const p = new URLSearchParams(window.location.search);
    if(p.get('card')) { setTimeout(() => openCardModal(parseInt(p.get('card'))), 500); }
}
