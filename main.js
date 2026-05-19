let currentUser = null;
let users = JSON.parse(localStorage.getItem('users')) || {};
let posts = JSON.parse(localStorage.getItem('posts')) || [];
let comments = JSON.parse(localStorage.getItem('comments')) || {};

// Добавляем тестовые посты если нет
if (posts.length === 0) {
    posts = [
        {
            id: Date.now(),
            userId: 'DemoUser',
            username: 'DemoUser',
            avatar: '😊',
            text: 'Привет! Это моя первая открытка 💌',
            stickers: ['😊', '❤️', '🎉'],
            photos: [],
            likes: 5,
            date: new Date().toISOString()
        },
        {
            id: Date.now() + 1,
            userId: 'ArtLover',
            username: 'ArtLover',
            avatar: '🎨',
            text: 'С днём рождения! Желаю счастья! 🎂',
            stickers: ['🎂', '🎁', '✨'],
            photos: [],
            likes: 3,
            date: new Date(Date.now() - 86400000).toISOString()
        }
    ];
    localStorage.setItem('posts', JSON.stringify(posts));
}

document.addEventListener('DOMContentLoaded', function() {
    loadCurrentUser();
    setupMenuEvents();
    renderMenu();
    renderFeed();
    setupFeedEvents();
    
    // Логотип на главную
    document.getElementById('logoArea').addEventListener('click', () => {
        window.location.href = 'index.html';
    });
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
    
    menuBtn.addEventListener('click', () => { sideMenu.classList.add('open'); overlay.classList.add('show'); });
    closeMenu.addEventListener('click', () => { sideMenu.classList.remove('open'); overlay.classList.remove('show'); });
    overlay.addEventListener('click', () => { sideMenu.classList.remove('open'); overlay.classList.remove('show'); });
}

function renderMenu() {
    const menuContent = document.getElementById('menuContent');
    const isAdmin = currentUser?.username === 'qweezer';
    
    if (currentUser) {
        menuContent.innerHTML = `
            <div class="user-info">
                <div class="avatar" style="width:45px;height:45px;background:linear-gradient(135deg,#667eea,#764ba2);border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:20px">${currentUser.username[0].toUpperCase()}</div>
                <div><strong>${currentUser.username}</strong><br>Активен</div>
            </div>
            <div class="menu-section"><h4>📬 Мои открытки</h4><div id="userPostsList" class="history-list"></div></div>
            ${isAdmin ? '<div class="menu-section"><h4>🔒 Все приватные</h4><div id="adminPrivateList" class="history-list"></div></div>' : ''}
            <button id="logoutMenuBtn" class="login-btn" style="background:#ff4444">🚪 Выйти</button>
        `;
        loadUserPosts();
        if (isAdmin) loadAdminPrivate();
        document.getElementById('logoutMenuBtn').addEventListener('click', logout);
    } else {
        menuContent.innerHTML = `
            <div class="menu-section"><h4>👤 Гость</h4><button id="showLoginMenu" class="login-btn">🔑 Войти</button></div>
            <div class="menu-section"><h4>📝 Регистрация</h4><button id="showRegisterMenu" class="login-btn">📝 Зарегистрироваться</button></div>
        `;
        document.getElementById('showLoginMenu')?.addEventListener('click', () => showAuthModal('login'));
        document.getElementById('showRegisterMenu')?.addEventListener('click', () => showAuthModal('register'));
    }
}

function loadUserPosts() {
    const container = document.getElementById('userPostsList');
    if (!container) return;
    
    const userPosts = posts.filter(p => p.userId === currentUser?.username);
    if (userPosts.length === 0) {
        container.innerHTML = '<p style="color:#999">У вас нет открыток</p>';
        return;
    }
    
    container.innerHTML = userPosts.map(post => `
        <div class="history-item" data-post-id="${post.id}">
            <strong>${post.text.substring(0, 30)}...</strong>
            <span style="font-size:11px; color:#999">❤️ ${post.likes}</span>
        </div>
    `).join('');
    
    document.querySelectorAll('#userPostsList .history-item').forEach(el => {
        el.addEventListener('click', () => {
            const post = posts.find(p => p.id == el.dataset.postId);
            if (post) openPostDetail(post);
        });
    });
}

function loadAdminPrivate() {
    const container = document.getElementById('adminPrivateList');
    if (!container) return;
    
    const privatePosts = posts.filter(p => p.isPrivate);
    if (privatePosts.length === 0) {
        container.innerHTML = '<p style="color:#999">Нет приватных открыток</p>';
        return;
    }
    
    container.innerHTML = privatePosts.map(post => `
        <div class="history-item" data-post-id="${post.id}">
            <strong>${post.username}: ${post.text.substring(0, 30)}...</strong>
            <span style="font-size:11px">🔒</span>
        </div>
    `).join('');
    
    document.querySelectorAll('#adminPrivateList .history-item').forEach(el => {
        el.addEventListener('click', () => {
            const post = posts.find(p => p.id == el.dataset.postId);
            if (post) openPostDetail(post);
        });
    });
}

function renderFeed() {
    const container = document.getElementById('feedList');
    const sortedPosts = [...posts].sort((a,b) => new Date(b.date) - new Date(a.date));
    
    if (sortedPosts.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:white">Нет открыток. Будьте первым!</p>';
        return;
    }
    
    container.innerHTML = sortedPosts.map(post => `
        <div class="feed-post" data-post-id="${post.id}">
            <div class="post-header">
                <div class="post-avatar">${post.avatar || '💌'}</div>
                <div class="post-user">${post.username}</div>
                <div class="post-date">${formatDate(post.date)}</div>
            </div>
            <div class="post-content" data-post-id="${post.id}">
                <div class="post-text">${escapeHtml(post.text)}</div>
                ${post.stickers && post.stickers.length ? `<div class="post-stickers">${post.stickers.map(s => `<span>${s}</span>`).join('')}</div>` : ''}
                ${post.photos && post.photos.length ? `<div class="post-photos">${post.photos.map(p => `<img src="${p.data}" style="width:60px;height:60px;object-fit:cover;border-radius:12px">`).join('')}</div>` : ''}
            </div>
            <div class="post-stats">
                <button class="like-btn ${post.likedBy?.includes(currentUser?.username) ? 'liked' : ''}" data-post-id="${post.id}">❤️ ${post.likes || 0}</button>
                <button class="comment-btn" data-post-id="${post.id}">💬 ${(comments[post.id] || []).length}</button>
            </div>
            <div class="comments-preview" data-post-id="${post.id}">
                ${(comments[post.id] || []).slice(0, 2).map(c => `<strong>${c.user}:</strong> ${c.text}`).join(' · ')}
                ${(comments[post.id] || []).length > 2 ? `<span style="color:#999">...ещё ${(comments[post.id] || []).length - 2}</span>` : ''}
                ${(comments[post.id] || []).length === 0 ? '💬 Напишите комментарий...' : ''}
            </div>
        </div>
    `).join('');
    
    // Обработчики лайков
    document.querySelectorAll('.like-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const postId = parseInt(btn.dataset.postId);
            likePost(postId);
        });
    });
    
    // Обработчики комментариев
    document.querySelectorAll('.comment-btn, .comments-preview').forEach(el => {
        el.addEventListener('click', (e) => {
            e.stopPropagation();
            const postId = parseInt(el.dataset.postId);
            openCommentsModal(postId);
        });
    });
    
    // Обработчики открытия поста
    document.querySelectorAll('.post-content').forEach(el => {
        el.addEventListener('click', () => {
            const postId = parseInt(el.dataset.postId);
            const post = posts.find(p => p.id === postId);
            if (post) openPostDetail(post);
        });
    });
}

function openPostDetail(post) {
    window.location.href = `card.html?data=${encodeURIComponent(JSON.stringify(post))}`;
}

function likePost(postId) {
    if (!currentUser) {
        alert('Войдите, чтобы ставить лайки!');
        showAuthModal('login');
        return;
    }
    
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    
    if (!post.likedBy) post.likedBy = [];
    
    if (post.likedBy.includes(currentUser.username)) {
        post.likedBy = post.likedBy.filter(u => u !== currentUser.username);
        post.likes--;
    } else {
        post.likedBy.push(currentUser.username);
        post.likes++;
    }
    
    localStorage.setItem('posts', JSON.stringify(posts));
    renderFeed();
}

function openCommentsModal(postId) {
    const modal = document.getElementById('commentsModal');
    const commentsList = document.getElementById('commentsList');
    const postComments = comments[postId] || [];
    
    commentsList.innerHTML = postComments.map(c => `
        <div class="comment-item">
            <div class="comment-user">${c.user}</div>
            <div class="comment-text">${escapeHtml(c.text)}</div>
        </div>
    `).join('');
    
    if (postComments.length === 0) {
        commentsList.innerHTML = '<p style="text-align:center; color:#999">Нет комментариев</p>';
    }
    
    modal.classList.add('show');
    document.getElementById('overlay').classList.add('show');
    
    const sendBtn = document.getElementById('sendCommentBtn');
    const input = document.getElementById('commentInput');
    
    const newSendHandler = () => {
        if (!currentUser) {
            alert('Войдите, чтобы комментировать!');
            modal.classList.remove('show');
            document.getElementById('overlay').classList.remove('show');
            showAuthModal('login');
            return;
        }
        
        const text = input.value.trim();
        if (text) {
            if (!comments[postId]) comments[postId] = [];
            comments[postId].push({
                user: currentUser.username,
                text: text,
                date: new Date().toISOString()
            });
            localStorage.setItem('comments', JSON.stringify(comments));
            input.value = '';
            openCommentsModal(postId);
        }
    };
    
    sendBtn.onclick = newSendHandler;
    input.onkeypress = (e) => { if (e.key === 'Enter') newSendHandler(); };
    
    document.getElementById('closeCommentsBtn').onclick = () => {
        modal.classList.remove('show');
        document.getElementById('overlay').classList.remove('show');
        renderFeed();
    };
}

function setupFeedEvents() {
    document.getElementById('createFeedBtn')?.addEventListener('click', () => {
        window.location.href = 'editor.html';
    });
    
    document.getElementById('showLoginBtnHeader')?.addEventListener('click', () => showAuthModal('login'));
    document.getElementById('showRegisterBtnHeader')?.addEventListener('click', () => showAuthModal('register'));
}

function showAuthModal(type) {
    const loginModal = document.getElementById('loginModal');
    const registerModal = document.getElementById('registerModal');
    const overlay = document.getElementById('overlay');
    
    if (type === 'login') {
        loginModal.classList.add('show');
    } else {
        registerModal.classList.add('show');
    }
    overlay.classList.add('show');
    
    // Закрытие модалок
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.onclick = () => {
            loginModal.classList.remove('show');
            registerModal.classList.remove('show');
            overlay.classList.remove('show');
        };
    });
    
    // Переключение
    document.getElementById('switchToRegister')?.addEventListener('click', (e) => {
        e.preventDefault();
        loginModal.classList.remove('show');
        registerModal.classList.add('show');
    });
    
    document.getElementById('switchToLogin')?.addEventListener('click', (e) => {
        e.preventDefault();
        registerModal.classList.remove('show');
        loginModal.classList.add('show');
    });
    
    // Логин
    document.getElementById('loginSubmitBtn').onclick = () => {
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;
        
        if (username === 'qweezer' && password === 'admin123') {
            currentUser = { username: 'qweezer' };
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            alert('Добро пожаловать, Администратор!');
            loginModal.classList.remove('show');
            registerModal.classList.remove('show');
            overlay.classList.remove('show');
            renderMenu();
            renderFeed();
            location.reload();
        } else if (users[username] && users[username].password === password) {
            currentUser = { username: username };
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            alert(`Добро пожаловать, ${username}!`);
            loginModal.classList.remove('show');
            registerModal.classList.remove('show');
            overlay.classList.remove('show');
            renderMenu();
            renderFeed();
            location.reload();
        } else {
            alert('Неверное имя или пароль');
        }
    };
    
    // Регистрация
    document.getElementById('registerSubmitBtn').onclick = () => {
        const username = document.getElementById('regUsername').value.trim();
        const password = document.getElementById('regPassword').value;
        
        if (users[username]) {
            alert('Пользователь уже существует');
        } else if (username.length < 3) {
            alert('Имя минимум 3 символа');
        } else if (password.length < 3) {
            alert('Пароль минимум 3 символа');
        } else {
            users[username] = { password: password, cards: [] };
            localStorage.setItem('users', JSON.stringify(users));
            currentUser = { username: username };
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            alert(`Регистрация успешна! Добро пожаловать, ${username}!`);
            registerModal.classList.remove('show');
            overlay.classList.remove('show');
            renderMenu();
            renderFeed();
            location.reload();
        }
    };
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    renderMenu();
    alert('Вы вышли');
    location.reload();
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'сегодня';
    if (days === 1) return 'вчера';
    if (days < 7) return `${days} дня назад`;
    return date.toLocaleDateString();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Экспорт для editor.js
window.addPost = function(postData, isPrivate) {
    const newPost = {
        id: Date.now(),
        userId: currentUser?.username || 'Аноним',
        username: currentUser?.username || 'Аноним',
        avatar: '💌',
        text: postData.text,
        stickers: postData.stickers.map(s => s.emoji || s),
        photos: postData.photos,
        likes: 0,
        likedBy: [],
        date: new Date().toISOString(),
        isPrivate: isPrivate
    };
    
    posts.unshift(newPost);
    localStorage.setItem('posts', JSON.stringify(posts));
    return newPost.id;
};