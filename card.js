let cardData = {};
let stickersElements = [];
let photosElements = [];

document.addEventListener('DOMContentLoaded', function() {
    loadCardData();
    setupViewEvents();
});

function loadCardData() {
    const urlParams = new URLSearchParams(window.location.search);
    const dataParam = urlParams.get('data');
    
    if (dataParam) {
        cardData = JSON.parse(decodeURIComponent(dataParam));
    } else {
        const saved = localStorage.getItem('savedCard');
        if (saved) {
            cardData = JSON.parse(saved);
        }
    }
    
    applyBackground();
    
    if (cardData.text) {
        displayCard();
    } else {
        document.getElementById('cardText').innerHTML = 'Открытка не найдена';
        document.getElementById('cardText').classList.add('show-text');
    }
}

function applyBackground() {
    const container = document.getElementById('cardContainer');
    if (cardData.bgColor1 && cardData.bgColor2) {
        container.style.background = `linear-gradient(135deg, ${cardData.bgColor1}, ${cardData.bgColor2})`;
    }
    
    const wrapper = document.getElementById('cardWrapper');
    if (cardData.patternData) {
        const patternDiv = document.createElement('div');
        patternDiv.className = 'view-background-pattern';
        const cols = Math.ceil(700 / (cardData.patternSize || 50));
        const rows = Math.ceil(600 / (cardData.patternSize || 50));
        for (let i = 0; i < cols * rows; i++) {
            const img = document.createElement('img');
            img.src = cardData.patternData;
            img.style.width = `${cardData.patternSize || 50}px`;
            img.style.height = `${cardData.patternSize || 50}px`;
            img.style.position = 'absolute';
            img.style.left = `${(i % cols) * (cardData.patternSize || 50)}px`;
            img.style.top = `${Math.floor(i / cols) * (cardData.patternSize || 50)}px`;
            img.style.opacity = (cardData.patternOpacity || 30) / 100;
            img.style.objectFit = 'cover';
            patternDiv.appendChild(img);
        }
        wrapper.style.position = 'relative';
        wrapper.insertBefore(patternDiv, wrapper.firstChild);
    }
}

function displayCard() {
    const cardText = document.getElementById('cardText');
    cardText.innerHTML = cardData.text.replace(/\n/g, '<br>');
    cardText.style.textAlign = cardData.textCenter ? 'center' : 'left';
    cardText.style.fontWeight = cardData.textBold ? 'bold' : 'normal';
    cardText.style.color = cardData.textColor || '#333333';
    
    const cardButton = document.getElementById('cardButton');
    cardButton.textContent = cardData.buttonText || 'Открыть открытку';
    if (cardData.buttonPhoto) {
        cardButton.style.background = `url(${cardData.buttonPhoto}) center/cover`;
    } else {
        cardButton.style.backgroundColor = cardData.buttonBgColor || '#ffa58a';
    }
    cardButton.style.color = cardData.buttonTextColor || '#333333';
    cardButton.style.padding = `${parseInt(cardData.buttonSize || 50) * 0.3}px ${parseInt(cardData.buttonSize || 50)}px`;
    cardButton.style.fontSize = `${parseInt(cardData.buttonSize || 50) * 0.4}px`;
    
    applyButtonStyle(cardButton);
    
    cardButton.addEventListener('click', function() {
        showCardText();
    });
    
    if (cardData.stickers && cardData.stickers.length > 0) {
        createDraggableStickers();
    }
    
    if (cardData.photos && cardData.photos.length > 0) {
        createDraggablePhotos();
    }
}

function applyButtonStyle(button) {
    switch(cardData.buttonStyle) {
        case 'rounded': button.style.borderRadius = '50px'; button.style.border = 'none'; break;
        case 'square': button.style.borderRadius = '5px'; button.style.border = 'none'; break;
        case 'shadow': button.style.borderRadius = '10px'; button.style.boxShadow = '0 5px 15px rgba(0,0,0,0.3)'; break;
        case 'glow': button.style.borderRadius = '10px'; button.style.boxShadow = `0 0 15px ${cardData.buttonBgColor || '#ffa58a'}`; break;
        case 'border': button.style.borderRadius = '10px'; button.style.border = `2px solid ${cardData.buttonTextColor || '#333333'}`; break;
        default: button.style.borderRadius = '50px';
    }
}

function showCardText() {
    const cardText = document.getElementById('cardText');
    if (cardText.classList.contains('show-text')) return;
    cardText.classList.add('show-text');
    
    const button = document.getElementById('cardButton');
    button.style.transform = 'scale(0.95)';
    setTimeout(() => button.style.transform = 'scale(1)', 200);
}

function createDraggableStickers() {
    const canvas = document.getElementById('stickersCanvas');
    canvas.innerHTML = '';
    stickersElements = [];
    
    cardData.stickers.forEach((sticker, index) => {
        const stickerElement = document.createElement('div');
        stickerElement.className = 'draggable-sticker';
        stickerElement.textContent = sticker.emoji || sticker;
        stickerElement.style.fontSize = '40px';
        
        const startX = sticker.x !== undefined ? sticker.x : Math.random() * (canvas.clientWidth - 80);
        const startY = sticker.y !== undefined ? sticker.y : Math.random() * (canvas.clientHeight - 80);
        
        stickerElement.style.left = `${Math.max(0, Math.min(startX, canvas.clientWidth - 80))}px`;
        stickerElement.style.top = `${Math.max(0, Math.min(startY, canvas.clientHeight - 80))}px`;
        
        canvas.appendChild(stickerElement);
        makeDraggable(stickerElement, index, 'sticker');
        stickersElements.push(stickerElement);
    });
}

function createDraggablePhotos() {
    const canvas = document.getElementById('photosCanvas');
    canvas.innerHTML = '';
    photosElements = [];
    
    cardData.photos.forEach((photo, index) => {
        const photoElement = document.createElement('div');
        photoElement.className = 'draggable-photo';
        const img = document.createElement('img');
        img.src = photo.data;
        img.style.width = `${cardData.photoSize || 60}px`;
        img.style.height = `${cardData.photoSize || 60}px`;
        img.style.objectFit = 'cover';
        img.style.borderRadius = '10px';
        photoElement.appendChild(img);
        
        const startX = photo.x !== undefined ? photo.x : Math.random() * (canvas.clientWidth - 80);
        const startY = photo.y !== undefined ? photo.y : Math.random() * (canvas.clientHeight - 80);
        
        photoElement.style.left = `${Math.max(0, Math.min(startX, canvas.clientWidth - 80))}px`;
        photoElement.style.top = `${Math.max(0, Math.min(startY, canvas.clientHeight - 80))}px`;
        
        canvas.appendChild(photoElement);
        makeDraggable(photoElement, index, 'photo');
        photosElements.push(photoElement);
    });
}

function makeDraggable(element, index, type) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    
    element.onmousedown = dragMouseDown;
    
    function dragMouseDown(e) {
        if (e.target.closest('.remove')) return;
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
        element.style.zIndex = '100';
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
        const maxTop = parent.clientHeight - element.clientHeight;
        const maxLeft = parent.clientWidth - element.clientWidth;
        
        newTop = Math.max(0, Math.min(newTop, maxTop));
        newLeft = Math.max(0, Math.min(newLeft, maxLeft));
        
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
        element.style.zIndex = '10';
    }
    
    element.ontouchstart = function(e) {
        e.preventDefault();
        const touch = e.touches[0];
        pos3 = touch.clientX;
        pos4 = touch.clientY;
        document.ontouchend = closeDragElement;
        document.ontouchmove = elementDragTouch;
    };
    
    function elementDragTouch(e) {
        e.preventDefault();
        const touch = e.touches[0];
        pos1 = pos3 - touch.clientX;
        pos2 = pos4 - touch.clientY;
        pos3 = touch.clientX;
        pos4 = touch.clientY;
        
        let newTop = element.offsetTop - pos2;
        let newLeft = element.offsetLeft - pos1;
        
        const parent = element.parentElement;
        const maxTop = parent.clientHeight - element.clientHeight;
        const maxLeft = parent.clientWidth - element.clientWidth;
        
        newTop = Math.max(0, Math.min(newTop, maxTop));
        newLeft = Math.max(0, Math.min(newLeft, maxLeft));
        
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
}

function setupViewEvents() {
    const createOwnBtn = document.getElementById('createOwnBtn');
    if (createOwnBtn) {
        createOwnBtn.addEventListener('click', () => {
            window.location.href = 'editor.html';
        });
    }
    
    const shareBtn = document.getElementById('shareCardBtn');
    if (shareBtn) {
        shareBtn.addEventListener('click', shareCard);
    }
}

function shareCard() {
    const shareUrl = `${window.location.origin}${window.location.pathname}?data=${encodeURIComponent(JSON.stringify(cardData))}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
        alert('✅ Ссылка на открытку скопирована!\n\nОтправь её другу!\n\n🔗 ' + shareUrl);
    }).catch(() => {
        prompt('📋 Скопируй эту ссылку:', shareUrl);
    });
}

window.addEventListener('resize', function() {
    const stickersCanvas = document.getElementById('stickersCanvas');
    const photosCanvas = document.getElementById('photosCanvas');
    
    [stickersCanvas, photosCanvas].forEach(canvas => {
        if (!canvas) return;
        const elements = canvas.querySelectorAll('.draggable-sticker, .draggable-photo');
        elements.forEach(el => {
            let left = parseFloat(el.style.left);
            let top = parseFloat(el.style.top);
            const maxLeft = canvas.clientWidth - el.clientWidth;
            const maxTop = canvas.clientHeight - el.clientHeight;
            if (left > maxLeft) el.style.left = maxLeft + 'px';
            if (top > maxTop) el.style.top = maxTop + 'px';
            if (left < 0) el.style.left = '0px';
            if (top < 0) el.style.top = '0px';
        });
    });
});