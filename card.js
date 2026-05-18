// Загрузка данных открытки
let cardData = {};

document.addEventListener('DOMContentLoaded', function() {
    loadCardData();
    setupViewEvents();
});

// Загрузка данных
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
    
    if (cardData.text) {
        displayCard();
    } else {
        document.getElementById('cardText').innerHTML = 'Открытка не найдена';
        document.getElementById('cardText').classList.add('show-text');
    }
}

// Отображение открытки
function displayCard() {
    const cardText = document.getElementById('cardText');
    cardText.innerHTML = cardData.text.replace(/\n/g, '<br>');
    cardText.style.textAlign = cardData.textCenter ? 'center' : 'left';
    cardText.style.fontWeight = cardData.textBold ? 'bold' : 'normal';
    
    const cardButton = document.getElementById('cardButton');
    cardButton.textContent = cardData.buttonText || 'Открыть открытку';
    cardButton.style.backgroundColor = cardData.buttonBgColor || '#FF6B6B';
    cardButton.style.color = cardData.buttonTextColor || '#FFFFFF';
    cardButton.style.padding = `${parseInt(cardData.buttonSize || 50) * 0.3}px ${parseInt(cardData.buttonSize || 50)}px`;
    cardButton.style.fontSize = `${parseInt(cardData.buttonSize || 50) * 0.4}px`;
    
    applyButtonStyle(cardButton);
    
    // Текст появляется ТОЛЬКО при клике на кнопку
    cardButton.addEventListener('click', function() {
        showCardText();
    });
    
    // Создаём перемещаемые стикеры
    if (cardData.stickers && cardData.stickers.length > 0) {
        createDraggableStickers(cardData.stickers);
    }
}

// Применение стиля к кнопке
function applyButtonStyle(button) {
    switch(cardData.buttonStyle) {
        case 'rounded':
            button.style.borderRadius = '50px';
            button.style.border = 'none';
            break;
        case 'circle':
            button.style.borderRadius = '50%';
            button.style.border = 'none';
            break;
        case 'square':
            button.style.borderRadius = '5px';
            button.style.border = 'none';
            break;
        case 'shadow':
            button.style.borderRadius = '10px';
            button.style.boxShadow = '0 5px 15px rgba(0,0,0,0.3)';
            break;
        case 'glow':
            button.style.borderRadius = '10px';
            button.style.boxShadow = `0 0 15px ${cardData.buttonBgColor || '#FF6B6B'}`;
            break;
        case 'border':
            button.style.borderRadius = '10px';
            button.style.border = `2px solid ${cardData.buttonTextColor || '#FFFFFF'}`;
            button.style.backgroundColor = 'transparent';
            break;
        default:
            button.style.borderRadius = '50px';
    }
}

// Показать текст (вызывается при нажатии на кнопку)
function showCardText() {
    const cardText = document.getElementById('cardText');
    
    if (cardText.classList.contains('show-text')) {
        return;
    }
    
    cardText.classList.add('show-text');
    
    // Анимация кнопки
    const button = document.getElementById('cardButton');
    button.style.transform = 'scale(0.95)';
    setTimeout(() => {
        button.style.transform = 'scale(1)';
    }, 200);
    
    // Анимация стикеров
    const allStickers = document.querySelectorAll('.draggable-sticker');
    allStickers.forEach(sticker => {
        sticker.style.transform = 'scale(1.1)';
        setTimeout(() => {
            sticker.style.transform = 'scale(1)';
        }, 300);
    });
}

// Создание перемещаемых стикеров
function createDraggableStickers(stickersList) {
    const canvas = document.getElementById('stickersCanvas');
    canvas.innerHTML = '';
    
    stickersList.forEach((sticker) => {
        const stickerElement = document.createElement('div');
        stickerElement.className = 'draggable-sticker';
        stickerElement.textContent = sticker;
        
        const startX = Math.random() * (canvas.clientWidth - 80);
        const startY = Math.random() * (canvas.clientHeight - 80);
        
        stickerElement.style.left = `${Math.max(0, Math.min(startX, canvas.clientWidth - 80))}px`;
        stickerElement.style.top = `${Math.max(0, Math.min(startY, canvas.clientHeight - 80))}px`;
        
        canvas.appendChild(stickerElement);
        makeDraggable(stickerElement);
    });
}

// Функция для перетаскивания (drag and drop)
function makeDraggable(element) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    
    element.onmousedown = dragMouseDown;
    
    function dragMouseDown(e) {
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
    }
    
    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
        element.style.zIndex = '10';
    }
    
    // Для touch-устройств
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
    }
}

// Настройка событий на странице просмотра
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

// Поделиться открыткой
function shareCard() {
    const shareUrl = `${window.location.origin}${window.location.pathname}?data=${encodeURIComponent(JSON.stringify(cardData))}`;
    
    navigator.clipboard.writeText(shareUrl).then(() => {
        alert('✅ Ссылка на открытку скопирована!\n\nОтправь её другу!\n\n🔗 ' + shareUrl);
    }).catch(() => {
        prompt('📋 Скопируй эту ссылку:', shareUrl);
    });
}

// Обновление размеров при изменении окна
window.addEventListener('resize', function() {
    const canvas = document.getElementById('stickersCanvas');
    if (!canvas) return;
    
    const stickers = document.querySelectorAll('.draggable-sticker');
    stickers.forEach(sticker => {
        let left = parseFloat(sticker.style.left);
        let top = parseFloat(sticker.style.top);
        
        const maxLeft = canvas.clientWidth - sticker.clientWidth;
        const maxTop = canvas.clientHeight - sticker.clientHeight;
        
        if (left > maxLeft) sticker.style.left = maxLeft + 'px';
        if (top > maxTop) sticker.style.top = maxTop + 'px';
        if (left < 0) sticker.style.left = '0px';
        if (top < 0) sticker.style.top = '0px';
    });
});