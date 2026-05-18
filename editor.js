// Состояние редактора
let cardState = {
    text: '',
    buttonText: 'Открыть открытку',
    buttonBgColor: '#FF6B6B',
    buttonTextColor: '#FFFFFF',
    buttonStyle: 'rounded',
    buttonSize: 50,
    stickers: [],
    textCenter: false,
    textBold: false
};

// Загрузка при старте
document.addEventListener('DOMContentLoaded', function() {
    initTabs();
    initEventListeners();
    initStickers();
    updateLivePreview();
});

// Инициализация вкладок
function initTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.dataset.tab;
            
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(`${tabId}Tab`).classList.add('active');
        });
    });
}

// Инициализация обработчиков событий
function initEventListeners() {
    // Текст
    const textArea = document.getElementById('cardText');
    textArea.addEventListener('input', (e) => {
        cardState.text = e.target.value;
        updateLivePreview();
    });
    
    // Настройки текста
    document.getElementById('textCenter').addEventListener('change', (e) => {
        cardState.textCenter = e.target.checked;
        updateLivePreview();
    });
    
    document.getElementById('textBold').addEventListener('change', (e) => {
        cardState.textBold = e.target.checked;
        updateLivePreview();
    });
    
    // Настройки кнопки
    document.getElementById('buttonText').addEventListener('input', (e) => {
        cardState.buttonText = e.target.value;
        updateLivePreview();
    });
    
    document.getElementById('buttonBgColor').addEventListener('input', (e) => {
        cardState.buttonBgColor = e.target.value;
        updateLivePreview();
    });
    
    document.getElementById('buttonTextColor').addEventListener('input', (e) => {
        cardState.buttonTextColor = e.target.value;
        updateLivePreview();
    });
    
    document.getElementById('buttonStyle').addEventListener('change', (e) => {
        cardState.buttonStyle = e.target.value;
        updateLivePreview();
    });
    
    document.getElementById('buttonSize').addEventListener('input', (e) => {
        cardState.buttonSize = e.target.value;
        document.getElementById('sizeValue').textContent = e.target.value;
        updateLivePreview();
    });
    
    // Сохранение открытки
    document.getElementById('saveCardBtn').addEventListener('click', saveCard);
    
    // Добавление своих стикеров
    document.getElementById('addCustomSticker').addEventListener('click', () => {
        const input = document.getElementById('customStickers');
        const stickers = input.value.split(' ');
        stickers.forEach(s => {
            if (s.trim()) addSticker(s.trim());
        });
        input.value = '';
        updateLivePreview();
    });
}

// Инициализация стикеров
function initStickers() {
    const stickers = document.querySelectorAll('.sticker');
    stickers.forEach(sticker => {
        sticker.addEventListener('click', () => {
            const emoji = sticker.dataset.sticker;
            addSticker(emoji);
            updateLivePreview();
        });
    });
}

// Добавление стикера
function addSticker(emoji) {
    if (!cardState.stickers.includes(emoji)) {
        cardState.stickers.push(emoji);
        updateSelectedStickers();
    }
}

// Удаление стикера
function removeSticker(emoji) {
    cardState.stickers = cardState.stickers.filter(s => s !== emoji);
    updateSelectedStickers();
    updateLivePreview();
}

// Обновление отображения выбранных стикеров
function updateSelectedStickers() {
    const container = document.getElementById('selectedStickers');
    container.innerHTML = '';
    
    cardState.stickers.forEach(sticker => {
        const div = document.createElement('div');
        div.className = 'sticker-item';
        div.innerHTML = `${sticker} <span class="remove" data-sticker="${sticker}">✖</span>`;
        container.appendChild(div);
    });
    
    document.querySelectorAll('.remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const sticker = btn.dataset.sticker;
            removeSticker(sticker);
        });
    });
}

// Обновление живого предпросмотра
function updateLivePreview() {
    // Обновляем текст
    const liveText = document.getElementById('liveText');
    liveText.textContent = cardState.text || 'Твой текст будет здесь';
    liveText.style.textAlign = cardState.textCenter ? 'center' : 'left';
    liveText.style.fontWeight = cardState.textBold ? 'bold' : 'normal';
    
    // Обновляем кнопку
    const liveButton = document.getElementById('liveButton');
    liveButton.textContent = cardState.buttonText;
    liveButton.style.backgroundColor = cardState.buttonBgColor;
    liveButton.style.color = cardState.buttonTextColor;
    liveButton.style.padding = `${parseInt(cardState.buttonSize) * 0.3}px ${parseInt(cardState.buttonSize)}px`;
    liveButton.style.fontSize = `${parseInt(cardState.buttonSize) * 0.4}px`;
    
    // Стиль кнопки
    switch(cardState.buttonStyle) {
        case 'rounded':
            liveButton.style.borderRadius = '50px';
            liveButton.style.border = 'none';
            break;
        case 'circle':
            liveButton.style.borderRadius = '50%';
            liveButton.style.border = 'none';
            break;
        case 'square':
            liveButton.style.borderRadius = '5px';
            liveButton.style.border = 'none';
            break;
        case 'shadow':
            liveButton.style.borderRadius = '10px';
            liveButton.style.boxShadow = '0 5px 15px rgba(0,0,0,0.3)';
            break;
        case 'glow':
            liveButton.style.borderRadius = '10px';
            liveButton.style.boxShadow = `0 0 15px ${cardState.buttonBgColor}`;
            break;
        case 'border':
            liveButton.style.borderRadius = '10px';
            liveButton.style.border = `2px solid ${cardState.buttonTextColor}`;
            liveButton.style.backgroundColor = 'transparent';
            break;
    }
    
    // Обновляем стикеры в живом предпросмотре
    const liveStickers = document.getElementById('liveStickers');
    liveStickers.innerHTML = '';
    cardState.stickers.forEach(sticker => {
        const span = document.createElement('span');
        span.textContent = sticker;
        span.style.fontSize = '30px';
        span.style.margin = '0 5px';
        liveStickers.appendChild(span);
    });
    
    // Обновляем предпросмотр во вкладке
    updatePreviewTab();
}

// Обновление вкладки предпросмотра
function updatePreviewTab() {
    const previewText = document.getElementById('previewText');
    const previewBtn = document.getElementById('previewBtn');
    const previewStickers = document.getElementById('previewStickers');
    
    previewText.textContent = cardState.text || 'Твой текст появится здесь...';
    previewBtn.textContent = cardState.buttonText;
    previewBtn.style.backgroundColor = cardState.buttonBgColor;
    previewBtn.style.color = cardState.buttonTextColor;
    
    previewStickers.innerHTML = '';
    cardState.stickers.forEach(sticker => {
        const span = document.createElement('span');
        span.textContent = sticker;
        span.style.fontSize = '30px';
        previewStickers.appendChild(span);
    });
}

// Сохранение открытки
function saveCard() {
    if (!cardState.text.trim()) {
        alert('✏️ Пожалуйста, напиши текст для открытки!');
        return;
    }
    
    const cardData = {
        text: cardState.text,
        buttonText: cardState.buttonText,
        buttonBgColor: cardState.buttonBgColor,
        buttonTextColor: cardState.buttonTextColor,
        buttonStyle: cardState.buttonStyle,
        buttonSize: cardState.buttonSize,
        stickers: cardState.stickers,
        textCenter: cardState.textCenter,
        textBold: cardState.textBold
    };
    
    localStorage.setItem('savedCard', JSON.stringify(cardData));
    window.location.href = `card.html?data=${encodeURIComponent(JSON.stringify(cardData))}`;
}