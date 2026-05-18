let cardState = {
    text: '',
    textColor: '#333333',
    textCenter: false,
    textBold: false,
    buttonText: 'Открыть открытку',
    buttonBgColor: '#ffa58a',
    buttonTextColor: '#333333',
    buttonStyle: 'rounded',
    buttonSize: 50,
    buttonPhoto: null,
    stickers: [],
    photos: [],
    photoSize: 60,
    bgColor1: '#faceb1',
    bgColor2: '#ffa58a',
    patternData: null,
    patternOpacity: 30,
    patternSize: 50
};

let photoFiles = [];

document.addEventListener('DOMContentLoaded', function() {
    initTabs();
    initEventListeners();
    initStickersGrid();
    updateLivePreview();
});

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

function initStickersGrid() {
    const commonStickers = ['😊', '❤️', '🎉', '🎂', '🎁', '⭐', '🔥', '✨', '🌸', '🐱', '🐶', '💖', '💎', '🌈', '🍕', '🎈', '🥳', '💪', '🤗', '😍'];
    const grid = document.getElementById('stickersGrid');
    grid.innerHTML = '';
    commonStickers.forEach(sticker => {
        const div = document.createElement('div');
        div.className = 'sticker';
        div.textContent = sticker;
        div.onclick = () => addSticker(sticker);
        grid.appendChild(div);
    });
}

function initEventListeners() {
    document.getElementById('cardText').addEventListener('input', (e) => {
        cardState.text = e.target.value;
        updateLivePreview();
    });
    document.getElementById('textCenter').addEventListener('change', (e) => {
        cardState.textCenter = e.target.checked;
        updateLivePreview();
    });
    document.getElementById('textBold').addEventListener('change', (e) => {
        cardState.textBold = e.target.checked;
        updateLivePreview();
    });
    document.getElementById('textColor').addEventListener('input', (e) => {
        cardState.textColor = e.target.value;
        updateLivePreview();
    });
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
    document.getElementById('photoSize').addEventListener('input', (e) => {
        cardState.photoSize = e.target.value;
        updateLivePreview();
    });
    document.getElementById('bgColor1').addEventListener('input', (e) => {
        cardState.bgColor1 = e.target.value;
        updateLivePreview();
    });
    document.getElementById('bgColor2').addEventListener('input', (e) => {
        cardState.bgColor2 = e.target.value;
        updateLivePreview();
    });
    document.getElementById('patternOpacity').addEventListener('input', (e) => {
        cardState.patternOpacity = e.target.value;
        updateLivePreview();
    });
    document.getElementById('patternSize').addEventListener('input', (e) => {
        cardState.patternSize = e.target.value;
        updateLivePreview();
    });
    
    document.getElementById('addCustomSticker').addEventListener('click', () => {
        const input = document.getElementById('customSticker');
        const stickers = input.value.split(' ');
        stickers.forEach(s => {
            if (s.trim() && cardState.stickers.length < 30) addSticker(s.trim());
        });
        input.value = '';
        updateLivePreview();
    });
    
    document.getElementById('photoUpload').addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                cardState.photos.push({ data: event.target.result, x: 50, y: 50 });
                updateSelectedPhotos();
                updateLivePreview();
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    });
    
    document.getElementById('buttonPhotoInput').addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                cardState.buttonPhoto = event.target.result;
                updateLivePreview();
                const preview = document.getElementById('buttonPhotoPreview');
                preview.innerHTML = `<img src="${cardState.buttonPhoto}" style="width:50px; height:50px; border-radius:10px">`;
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    });
    
    document.getElementById('patternUpload').addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                cardState.patternData = event.target.result;
                updateLivePreview();
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    });
    
    document.getElementById('clearPattern').addEventListener('click', () => {
        cardState.patternData = null;
        updateLivePreview();
    });
    
    document.getElementById('saveCardBtn').addEventListener('click', saveCard);
}

function addSticker(emoji) {
    if (cardState.stickers.length >= 30) {
        alert('Максимум 30 эмодзи!');
        return;
    }
    cardState.stickers.push({ emoji: emoji, x: Math.random() * 300, y: Math.random() * 200 });
    updateSelectedStickers();
    updateLivePreview();
}

function removeSticker(index) {
    cardState.stickers.splice(index, 1);
    updateSelectedStickers();
    updateLivePreview();
}

function removePhoto(index) {
    cardState.photos.splice(index, 1);
    updateSelectedPhotos();
    updateLivePreview();
}

function updateSelectedStickers() {
    const container = document.getElementById('selectedStickers');
    const countSpan = document.getElementById('stickerCount');
    container.innerHTML = '';
    countSpan.textContent = cardState.stickers.length;
    
    cardState.stickers.forEach((sticker, i) => {
        const div = document.createElement('div');
        div.className = 'sticker-item';
        div.innerHTML = `${sticker.emoji} <span class="remove" data-index="${i}">✖</span>`;
        container.appendChild(div);
    });
    
    document.querySelectorAll('.sticker-item .remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(btn.dataset.index);
            removeSticker(index);
        });
    });
}

function updateSelectedPhotos() {
    const container = document.getElementById('selectedPhotos');
    container.innerHTML = '';
    
    cardState.photos.forEach((photo, i) => {
        const div = document.createElement('div');
        div.className = 'photo-item';
        div.innerHTML = `<img src="${photo.data}"><span class="remove-photo" data-index="${i}">✖</span>`;
        container.appendChild(div);
    });
    
    document.querySelectorAll('.remove-photo').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(btn.dataset.index);
            removePhoto(index);
        });
    });
}

function updateLivePreview() {
    const livePreview = document.getElementById('livePreview');
    livePreview.style.background = `linear-gradient(135deg, ${cardState.bgColor1}, ${cardState.bgColor2})`;
    
    const liveText = document.getElementById('liveText');
    liveText.textContent = cardState.text || 'Твой текст будет здесь';
    liveText.style.textAlign = cardState.textCenter ? 'center' : 'left';
    liveText.style.fontWeight = cardState.textBold ? 'bold' : 'normal';
    liveText.style.color = cardState.textColor;
    
    const liveButton = document.getElementById('liveButton');
    liveButton.textContent = cardState.buttonText;
    if (cardState.buttonPhoto) {
        liveButton.style.background = `url(${cardState.buttonPhoto}) center/cover`;
    } else {
        liveButton.style.backgroundColor = cardState.buttonBgColor;
    }
    liveButton.style.color = cardState.buttonTextColor;
    liveButton.style.padding = `${parseInt(cardState.buttonSize) * 0.3}px ${parseInt(cardState.buttonSize)}px`;
    liveButton.style.fontSize = `${parseInt(cardState.buttonSize) * 0.4}px`;
    
    switch(cardState.buttonStyle) {
        case 'rounded': liveButton.style.borderRadius = '50px'; liveButton.style.border = 'none'; break;
        case 'square': liveButton.style.borderRadius = '5px'; liveButton.style.border = 'none'; break;
        case 'shadow': liveButton.style.borderRadius = '10px'; liveButton.style.boxShadow = '0 5px 15px rgba(0,0,0,0.3)'; break;
        case 'glow': liveButton.style.borderRadius = '10px'; liveButton.style.boxShadow = `0 0 15px ${cardState.buttonBgColor}`; break;
        case 'border': liveButton.style.borderRadius = '10px'; liveButton.style.border = `2px solid ${cardState.buttonTextColor}`; break;
    }
    
    const liveStickers = document.getElementById('liveStickers');
    liveStickers.innerHTML = '';
    cardState.stickers.forEach(sticker => {
        const span = document.createElement('span');
        span.textContent = sticker.emoji;
        span.style.fontSize = '35px';
        span.style.margin = '0 5px';
        liveStickers.appendChild(span);
    });
    
    const livePhotos = document.getElementById('livePhotos');
    livePhotos.innerHTML = '';
    cardState.photos.forEach(photo => {
        const img = document.createElement('img');
        img.src = photo.data;
        img.style.width = `${cardState.photoSize}px`;
        img.style.height = `${cardState.photoSize}px`;
        img.style.objectFit = 'cover';
        img.style.margin = '0 5px';
        img.style.borderRadius = '10px';
        livePhotos.appendChild(img);
    });
    
    const patternContainer = document.getElementById('livePattern');
    patternContainer.innerHTML = '';
    if (cardState.patternData) {
        const cols = Math.ceil(600 / cardState.patternSize);
        const rows = Math.ceil(400 / cardState.patternSize);
        for (let i = 0; i < cols * rows; i++) {
            const img = document.createElement('img');
            img.src = cardState.patternData;
            img.style.width = `${cardState.patternSize}px`;
            img.style.height = `${cardState.patternSize}px`;
            img.style.position = 'absolute';
            img.style.left = `${(i % cols) * cardState.patternSize}px`;
            img.style.top = `${Math.floor(i / cols) * cardState.patternSize}px`;
            img.style.opacity = cardState.patternOpacity / 100;
            img.style.objectFit = 'cover';
            patternContainer.appendChild(img);
        }
    }
}

function saveCard() {
    if (!cardState.text.trim()) {
        alert('✏️ Пожалуйста, напиши текст для открытки!');
        return;
    }
    
    const cardData = {
        text: cardState.text,
        textColor: cardState.textColor,
        textCenter: cardState.textCenter,
        textBold: cardState.textBold,
        buttonText: cardState.buttonText,
        buttonBgColor: cardState.buttonBgColor,
        buttonTextColor: cardState.buttonTextColor,
        buttonStyle: cardState.buttonStyle,
        buttonSize: cardState.buttonSize,
        buttonPhoto: cardState.buttonPhoto,
        stickers: cardState.stickers,
        photos: cardState.photos,
        photoSize: cardState.photoSize,
        bgColor1: cardState.bgColor1,
        bgColor2: cardState.bgColor2,
        patternData: cardState.patternData,
        patternOpacity: cardState.patternOpacity,
        patternSize: cardState.patternSize
    };
    
    localStorage.setItem('savedCard', JSON.stringify(cardData));
    window.location.href = `card.html?data=${encodeURIComponent(JSON.stringify(cardData))}`;
}