let cardData = {};

document.addEventListener('DOMContentLoaded', function() {
    loadCardData();
    setupViewEvents();
    setupMenuEvents();
    renderMenuInCard();
});

function loadCardData() {
    const urlParams = new URLSearchParams(window.location.search);
    const dataParam = urlParams.get('data');
    
    if (dataParam) {
        try { cardData = JSON.parse(decodeURIComponent(dataParam)); } catch(e) {}
    } else {
        const saved = localStorage.getItem('savedCard');
        if (saved) { try { cardData = JSON.parse(saved); } catch(e) {} }
    }
    
    applyBackground();
    if (cardData.text) displayCard();
    else {
        const textEl = document.getElementById('cardText');
        if (textEl) { textEl.innerHTML = 'Открытка не найдена'; textEl.classList.add('show-text'); }
    }
}

function applyBackground() {
    const container = document.getElementById('cardContainer');
    if (container && cardData.bgColor1 && cardData.bgColor2) {
        container.style.background = `linear-gradient(135deg, ${cardData.bgColor1}, ${cardData.bgColor2})`;
    }
    
    const wrapper = document.getElementById('cardWrapper');
    if (wrapper && cardData.patternData) {
        const patternDiv = document.createElement('div');
        patternDiv.className = 'view-background-pattern';
        const cols = Math.ceil(600 / (cardData.patternSize || 50));
        const rows = Math.ceil(500 / (cardData.patternSize || 50));
        for (let i = 0; i < cols * rows; i++) {
            const img = document.createElement('img');
            img.src = cardData.patternData;
            img.style.width = `${cardData.patternSize || 50}px`;
            img.style.height = `${cardData.patternSize || 50}px`;
            img.style.position = 'absolute';
            img.style.left = `${(i % cols) * (cardData.patternSize || 50)}px`;
            img.style.top = `${Math.floor(i / cols) * (cardData.patternSize || 50)}px`;
            img.style.opacity = (cardData.patternOpacity || 20) / 100;
            patternDiv.appendChild(img);
        }
        wrapper.insertBefore(patternDiv, wrapper.firstChild);
    }
}

function displayCard() {
    const cardText = document.getElementById('cardText');
    if (cardText) {
        cardText.innerHTML = (cardData.text || '').replace(/\n/g, '<br>');
        cardText.style.textAlign = cardData.textCenter ? 'center' : 'left';
        cardText.style.fontWeight = cardData.textBold ? 'bold' : 'normal';
        cardText.style.color = cardData.textColor || '#333';
    }
    
    const cardButton = document.getElementById('cardButton');
    if (cardButton) {
        cardButton.textContent = cardData.buttonText || 'Открыть';
        if (cardData.buttonPhoto) {
            cardButton.style.background = `url(${cardData.buttonPhoto}) center/cover`;
        } else {
            cardButton.style.background = `linear-gradient(135deg, ${cardData.buttonBgColor || '#667eea'}, ${cardData.buttonBgColor || '#764ba2'})`;
        }
        cardButton.style.color = cardData.buttonTextColor || '#fff';
        cardButton.style.padding = `${parseInt(cardData.buttonSize || 50) * 0.3}px ${parseInt(cardData.buttonSize || 50)}px`;
        cardButton.style.fontSize = `${parseInt(cardData.buttonSize || 50) * 0.4}px`;
        if (cardData.buttonStyle === 'rounded') cardButton.style.borderRadius = '60px';
        else if (cardData.buttonStyle === 'square') cardButton.style.borderRadius = '12px';
        
        cardButton.addEventListener('click', function() {
            showCardTextWithAnimation();
            playFullAnimation();
        });
    }
    
    if (cardData.stickers && cardData.stickers.length) createDraggableStickers();
    if (cardData.photos && cardData.photos.length) createDraggablePhotos();
}

function showCardTextWithAnimation() {
    const cardText = document.getElementById('cardText');
    if (!cardText || cardText.classList.contains('show-text')) return;
    cardText.classList.add('show-text');
    cardText.classList.add('animate');
    setTimeout(() => cardText.classList.remove('animate'), 600);
    
    const button = document.getElementById('cardButton');
    if (button) {
        button.classList.add('animate');
        setTimeout(() => button.classList.remove('animate'), 500);
    }
}

function playFullAnimation() {
    const animType = cardData.animation || 'gift';
    const overlay = document.createElement('div');
    overlay.className = 'animation-overlay';
    document.body.appendChild(overlay);
    
    switch(animType) {
        case 'gift':
            const gift = document.createElement('div');
            gift.className = 'gift-animation';
            gift.textContent = '🎁';
            overlay.appendChild(gift);
            for(let i = 0; i < 60; i++) {
                const conf = document.createElement('div');
                conf.className = 'confetti';
                conf.style.left = Math.random() * window.innerWidth + 'px';
                conf.style.backgroundColor = `hsl(${Math.random() * 360}, 80%, 60%)`;
                overlay.appendChild(conf);
            }
            break;
        case 'poop':
            const poop = document.createElement('div');
            poop.className = 'poop-animation';
            poop.textContent = '💩';
            overlay.appendChild(poop);
            break;
        case 'bouquet':
            const bouquet = document.createElement('div');
            bouquet.className = 'bouquet-animation';
            bouquet.textContent = '💐';
            overlay.appendChild(bouquet);
            break;
        case 'fart':
            const fart = document.createElement('div');
            fart.className = 'fart-animation';
            fart.textContent = '💨';
            overlay.appendChild(fart);
            break;
        case 'fall':
            const fall = document.createElement('div');
            fall.className = 'fall-animation';
            fall.textContent = '📦';
            overlay.appendChild(fall);
            break;
    }
    setTimeout(() => overlay.remove(), 1800);
}

function createDraggableStickers() {
    const canvas = document.getElementById('stickersCanvas');
    if (!canvas) return;
    canvas.innerHTML = '';
    cardData.stickers.forEach((sticker, idx) => {
        const el = document.createElement('div');
        el.className = 'draggable-sticker';
        el.textContent = sticker.emoji || sticker;
        el.style.fontSize = '35px';
        el.style.left = (sticker.x || Math.random() * (canvas.clientWidth - 80)) + 'px';
        el.style.top = (sticker.y || Math.random() * (canvas.clientHeight - 80)) + 'px';
        canvas.appendChild(el);
        makeDraggable(el, idx, 'sticker');
    });
}

function createDraggablePhotos() {
    const canvas = document.getElementById('photosCanvas');
    if (!canvas) return;
    canvas.innerHTML = '';
    cardData.photos.forEach((photo, idx) => {
        const el = document.createElement('div');
        el.className = 'draggable-photo';
        const img = document.createElement('img');
        img.src = photo.data;
        img.style.width = `${cardData.photoSize || 60}px`;
        el.appendChild(img);
        el.style.left = (photo.x || Math.random() * (canvas.clientWidth - 80)) + 'px';
        el.style.top = (photo.y || Math.random() * (canvas.clientHeight - 80)) + 'px';
        canvas.appendChild(el);
        makeDraggable(el, idx, 'photo');
    });
}

function makeDraggable(element, index, type) {
    let pos1=0,pos2=0,pos3=0,pos4=0;
    element.onmousedown = dragMouseDown;
    function dragMouseDown(e) {
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }
    function elementDrag(e) {
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        let newTop = element.offsetTop - pos2;
        let newLeft = element.offsetLeft - pos1;
        const parent = element.parentElement;
        newTop = Math.max(0, Math.min(newTop, parent.clientHeight - element.clientHeight));
        newLeft = Math.max(0, Math.min(newLeft, parent.clientWidth - element.clientWidth));
        element.style.top = newTop + "px";
        element.style.left = newLeft + "px";
        if (type === 'sticker' && cardData.stickers[index]) {
            cardData.stickers[index].x = newLeft;
            cardData.stickers[index].y = newTop;
        } else if (type === 'photo' && cardData.photos[index]) {
            cardData.photos[index].x = newLeft;
            cardData.photos[index].y = newTop;
        }
    }
    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

function setupViewEvents() {
    document.getElementById('createOwnBtn')?.addEventListener('click', () => { window.location.href = 'index.html'; });
    document.getElementById('shareCardBtn')?.addEventListener('click', () => {
        const url = `${window.location.origin}${window.location.pathname}?data=${encodeURIComponent(JSON.stringify(cardData))}`;
        navigator.clipboard.writeText(url);
        alert('✅ Ссылка скопирована!');
    });
    document.getElementById('likeBtn')?.addEventListener('click', () => alert('❤️ Спасибо!'));
    document.getElementById('reportBtn')?.addEventListener('click', () => alert('🚩 Жалоба отправлена'));
}

function setupMenuEvents() {
    const menuBtn = document.getElementById('menuBtn');
    const closeMenu = document.getElementById('closeMenu');
    const overlay = document.getElementById('overlay');
    const sideMenu = document.getElementById('sideMenu');
    menuBtn?.addEventListener('click', () => { sideMenu.classList.add('open'); overlay.classList.add('show'); });
    closeMenu?.addEventListener('click', () => { sideMenu.classList.remove('open'); overlay.classList.remove('show'); });
    overlay?.addEventListener('click', () => { sideMenu.classList.remove('open'); overlay.classList.remove('show'); });
}

function renderMenuInCard() {
    const menuContent = document.getElementById('menuContent');
    if (!menuContent) return;
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (user) {
        menuContent.innerHTML = `
            <div class="user-info"><div class="avatar" style="width:45px;height:45px;background:linear-gradient(135deg,#667eea,#764ba2);border-radius:50%;display:flex;align-items:center;justify-content:center;color:white">${user.username[0]}</div><div><strong>${user.username}</strong></div></div>
            <button id="logoutMenuCard" class="login-btn" style="background:#ff4444">🚪 Выйти</button>
        `;
        document.getElementById('logoutMenuCard')?.addEventListener('click', () => { localStorage.removeItem('currentUser'); location.reload(); });
    } else {
        menuContent.innerHTML = `<div class="menu-section"><h4>👤 Гость</h4></div>`;
    }
}