let currentUser = null;
let users = JSON.parse(localStorage.getItem('users')) || {};
let publicCards = JSON.parse(localStorage.getItem('publicCards')) || [];
let privateCards = JSON.parse(localStorage.getItem('privateCards')) || {};

document.addEventListener('DOMContentLoaded', function() {
    loadCurrentUser();
    setupMenuEvents();
    renderMenu();
});

function loadCurrentUser() {
    const saved = localStorage.getItem('currentUser');
    if (saved) currentUser = JSON.parse(saved);
}

function setupMenuEvents() {
    const menuBtn = document.getElementById('menuBtn');
    const closeMenu = document.getElementById('closeMenu');
    const overlay = document.getElementById('overlay');
    const sideMenu = document.getElementById('sideMenu');
    
    if (menuBtn) menuBtn.addEventListener('click', () => { sideMenu.classList.add('open'); overlay.classList.add('show'); });
    if (closeMenu) closeMenu.addEventListener('click', () => { sideMenu.classList.remove('open'); overlay.classList.remove('show'); });
    if (overlay) overlay.addEventListener('click', () => { sideMenu.classList.remove('open'); overlay.classList.remove('show'); });
}

function renderMenu() {
    const menuContent = document.getElementById('menuContent');
    if (!menuContent) return;
    
    const isAdmin = currentUser?.username === 'qweezer';
    
    if (currentUser) {
        let html = `
            <div class="user-info">
                <div class="avatar" style="width:50px;height:50px;background:linear-gradient(135deg,#667eea,#764ba2);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:24px;color:white">${currentUser.username[0].toUpperCase()}</div>
                <div><strong>${currentUser.username}</strong><br>Активен</div>
            </div>
            <div class="menu-section"><h4>📬 Мои открытки</h4><div id="userCardsList" class="history-list"></div></div>
        `;
        
        if (isAdmin) {
            html += `<div class="menu-section"><h4>🔒 Все приватные открытки</h4><div id="allPrivateCardsList" class="history-list"></div></div>`;
        }
        
        html += `<button id="logoutMenuBtn" class="login-btn" style="background:#ff4444">🚪 Выйти</button>`;
        menuContent.innerHTML = html;
        
        loadUserCards();
        if (isAdmin) loadAllPrivateCards();
        
        document.getElementById('logoutMenuBtn')?.addEventListener('click', logout);
    } else {
        menuContent.innerHTML = `
            <div class="menu-section"><h4>👤 Анонимный режим</h4><button id="showLoginBtn" class="login-btn">🔑 Войти</button></div>
            <div class="menu-section"><h4>🌍 Публичные открытки</h4><div id="publicCardsList" class="history-list"></div></div>
        `;
        loadPublicCards();
        document.getElementById('showLoginBtn')?.addEventListener('click', showAuthModal);
    }
}

function loadUserCards() {
    const container = document.getElementById('userCardsList');
    if (!container) return;
    
    const userCards = users[currentUser?.username]?.cards || [];
    
    if (userCards.length === 0) {
        container.innerHTML = '<p style="color:#999">Нет открыток</p>';
        return;
    }
    
    container.innerHTML = userCards.map((card, idx) => `
        <div class="history-item" data-card='${JSON.stringify(card)}'>
            <strong>${card.sender || 'Вы'}</strong>
            <span style="font-size:12px">${new Date(card.date).toLocaleDateString()}</span>
        </div>
    `).join('');
    
    document.querySelectorAll('#userCardsList .history-item').forEach(el => {
        el.addEventListener('click', () => {
            const card = JSON.parse(el.dataset.card);
            window.location.href = `card.html?data=${encodeURIComponent(JSON.stringify(card.data))}&cardId=${card.id}`;
        });
    });
}

function loadAllPrivateCards() {
    const container = document.getElementById('allPrivateCardsList');
    if (!container) return;
    
    let allPrivate = [];
    for (let user in privateCards) {
        if (privateCards[user]) allPrivate.push(...privateCards[user]);
    }
    for (let user in users) {
        if (users[user].cards) {
            allPrivate.push(...users[user].cards.filter(c => c.isPrivate));
        }
    }
    
    if (allPrivate.length === 0) {
        container.innerHTML = '<p style="color:#999">Нет приватных открыток</p>';
        return;
    }
    
    container.innerHTML = allPrivate.map((card, idx) => `
        <div class="history-item" data-card='${JSON.stringify(card)}'>
            <strong>${card.sender || 'Аноним'}</strong>
            <span style="font-size:12px">${new Date(card.date).toLocaleDateString()}</span>
            <span style="background:#ff9800; padding:2px 8px; border-radius:10px; font-size:10px; margin-left:8px">🔒 Приватная</span>
        </div>
    `).join('');
    
    document.querySelectorAll('#allPrivateCardsList .history-item').forEach(el => {
        el.addEventListener('click', () => {
            const card = JSON.parse(el.dataset.card);
            window.location.href = `card.html?data=${encodeURIComponent(JSON.stringify(card.data))}&cardId=${card.id}`;
        });
    });
}

function loadPublicCards() {
    const container = document.getElementById('publicCardsList');
    if (!container) return;
    
    const publicOnly = publicCards.filter(c => !c.isPrivate);
    
    if (publicOnly.length === 0) {
        container.innerHTML = '<p style="color:#999">Нет публичных открыток</p>';
        return;
    }
    
    container.innerHTML = publicOnly.map((card, idx) => `
        <div class="history-item" data-card='${JSON.stringify(card)}'>
            <strong>${card.sender || 'Аноним'}</strong>
            <span style="font-size:12px">${new Date(card.date).toLocaleDateString()}</span>
        </div>
    `).join('');
    
    document.querySelectorAll('#publicCardsList .history-item').forEach(el => {
        el.addEventListener('click', () => {
            const card = JSON.parse(el.dataset.card);
            window.location.href = `card.html?data=${encodeURIComponent(JSON.stringify(card.data))}&cardId=${card.id}`;
        });
    });
}

function showAuthModal() {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.style.position = 'fixed';
    modal.style.top = '50%';
    modal.style.left = '50%';
    modal.style.transform = 'translate(-50%, -50%)';
    modal.style.background = 'white';
    modal.style.padding = '30px';
    modal.style.borderRadius = '30px';
    modal.style.zIndex = '3000';
    modal.style.width = '320px';
    modal.innerHTML = `
        <h3>Вход</h3>
        <input type="text" id="authUser" placeholder="Имя" style="width:100%; padding:10px; margin:10px 0">
        <input type="password" id="authPass" placeholder="Пароль" style="width:100%; padding:10px; margin:10px 0">
        <button id="authSubmit" style="width:100%; padding:12px; background:linear-gradient(135deg,#667eea,#764ba2); color:white; border:none; border-radius:30px">Войти</button>
        <button id="authClose" style="width:100%; padding:10px; margin-top:10px; background:#ccc; border:none; border-radius:30px">Закрыть</button>
        <p style="text-align:center; margin-top:10px"><a href="#" id="switchAuthMode">Регистрация</a></p>
    `;
    document.body.appendChild(modal);
    document.getElementById('overlay').classList.add('show');
    
    let isLogin = true;
    
    const switchLink = document.getElementById('switchAuthMode');
    const authTitle = modal.querySelector('h3');
    const submitBtn = document.getElementById('authSubmit');
    
    switchLink.onclick = (e) => {
        e.preventDefault();
        isLogin = !isLogin;
        authTitle.textContent = isLogin ? 'Вход' : 'Регистрация';
        submitBtn.textContent = isLogin ? 'Войти' : 'Зарегистрироваться';
        switchLink.textContent = isLogin ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти';
    };
    
    document.getElementById('authSubmit').onclick = () => {
        const username = document.getElementById('authUser').value.trim();
        const password = document.getElementById('authPass').value;
        
        if (isLogin) {
            if (username === 'qweezer' && password === 'admin123') {
                currentUser = { username: 'qweezer' };
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                alert('Добро пожаловать, Администратор!');
                modal.remove();
                document.getElementById('overlay').classList.remove('show');
                renderMenu();
                location.reload();
            } else if (users[username] && users[username].password === password) {
                currentUser = { username: username };
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                alert(`Добро пожаловать, ${username}!`);
                modal.remove();
                document.getElementById('overlay').classList.remove('show');
                renderMenu();
                location.reload();
            } else {
                alert('Неверное имя или пароль');
            }
        } else {
            if (users[username]) {
                alert('Пользователь уже существует');
            } else if (username.length < 3) {
                alert('Имя минимум 3 символа');
            } else {
                users[username] = { password: password, cards: [] };
                localStorage.setItem('users', JSON.stringify(users));
                currentUser = { username: username };
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                alert(`Регистрация успешна! Добро пожаловать, ${username}!`);
                modal.remove();
                document.getElementById('overlay').classList.remove('show');
                renderMenu();
                location.reload();
            }
        }
    };
    
    document.getElementById('authClose').onclick = () => {
        modal.remove();
        document.getElementById('overlay').classList.remove('show');
    };
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    renderMenu();
    alert('Вы вышли');
    location.reload();
}

window.saveCardToSystem = function(cardData, isPrivate, recipient) {
    const newCard = {
        id: Date.now(),
        sender: currentUser?.username || 'Аноним',
        recipient: recipient || null,
        data: cardData,
        date: new Date().toISOString(),
        isPrivate: isPrivate,
        likes: 0,
        animation: cardData.animation || 'gift'
    };
    
    if (!isPrivate) {
        publicCards.unshift(newCard);
        localStorage.setItem('publicCards', JSON.stringify(publicCards));
    }
    
    if (currentUser) {
        if (!users[currentUser.username].cards) users[currentUser.username].cards = [];
        users[currentUser.username].cards.unshift(newCard);
        localStorage.setItem('users', JSON.stringify(users));
    }
    
    if (isPrivate && currentUser) {
        if (!privateCards[currentUser.username]) privateCards[currentUser.username] = [];
        privateCards[currentUser.username].push(newCard);
        localStorage.setItem('privateCards', JSON.stringify(privateCards));
    }
    
    return newCard.id;
};