let cardState = {
    text: '',
    textColor: '#333333',
    textCenter: false,
    textBold: false,
    buttonText: 'Открыть открытку',
    buttonBgColor: '#667eea',
    buttonTextColor: '#ffffff',
    buttonStyle: 'rounded',
    buttonSize: 50,
    buttonPhoto: null,
    stickers: [],
    photos: [],
    photoSize: 60,
    bgColor1: '#667eea',
    bgColor2: '#764ba2',
    patternData: null,
    patternOpacity: 20,
    patternSize: 50,
    animation: 'gift'
};

document.addEventListener('DOMContentLoaded', function() {
    initTabs();
    initEventListeners();
    initStickersGrid();
    initAnimations();
    updateLivePreview();
    
    const saveBtn = document.getElementById('saveCardBtn');
    if (saveBtn) saveBtn.addEventListener('click', saveCard);
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
            const target = document.getElementById(`${tabId}Tab`);
            if (target) target.classList.add('active');
        });
    });
}

function initAnimations() {
    const animations = document.querySelectorAll('[data-animation]');
    animations.forEach(anim => {
        anim.addEventListener('click', () => {
            cardState.animation = anim.dataset.animation;
            const animNames = { gift: 'Подарок 🎁', poop: 'Накакали 💩', bouquet: 'Букет 💐', fart: 'Пук 💨', fall: 'Упало 📦' };
            const selectedSpan = document.getElementById('selectedAnimation');
            if (selectedSpan) selectedSpan.innerHTML = `✨ Выбрано: ${animNames[cardState.animation]} ✨`;
            updateLivePreview();
        });
    });
}

function initStickersGrid() {
    const stickers = ['😊','❤️','🎉','🎂','⭐','✨','🌸','🐱','💖','🌈','🎈','🥳'];
    const grid = document.getElementById('stickersGrid');
    if (!grid) return;
    grid.innerHTML = '';
    stickers.forEach(sticker => {
        const div = document.createElement('div');
        div.className = 'sticker';
        div.textContent = sticker;
        div.onclick = () => addSticker(sticker);
        grid.appendChild(div);
    });
}

function initEventListeners() {
    const textArea = document.getElementById('cardText');
    if (textArea) textArea.addEventListener('input', (e) => { cardState.text = e.target.value; updateLivePreview(); });
    
    document.getElementById('textCenter')?.addEventListener('change', (e) => { cardState.textCenter = e.target.checked; updateLivePreview(); });
    document.getElementById('textBold')?.addEventListener('change', (e) => { cardState.textBold = e.target.checked; updateLivePreview(); });
    document.getElementById('textColor')?.addEventListener('input', (e) => { cardState.textColor = e.target.value; updateLivePreview(); });
    document.getElementById('buttonText')?.addEventListener('input', (e) => { cardState.buttonText = e.target.value; updateLivePreview(); });
    document.getElementById('buttonBgColor')?.addEventListener('input', (e) => { cardState.buttonBgColor = e.target.value; updateLivePreview(); });
    document.getElementById('buttonTextColor')?.addEventListener('input', (e) => { cardState.buttonTextColor = e.target.value; updateLivePreview(); });
    document.getElementById('buttonStyle')?.addEventListener('change', (e) => { cardState.buttonStyle = e.target.value; updateLivePreview(); });
    document.getElementById('buttonSize')?.addEventListener('input', (e) => { cardState.buttonSize = e.target.value; document.getElementById('sizeValue').textContent = e.target.value; updateLivePreview(); });
    document.getElementById('photoSize')?.addEventListener('input', (e) => { cardState.photoSize = e.target.value; updateLivePreview(); });
    document.getElementById('bgColor1')?.addEventListener('input', (e) => { cardState.bgColor1 = e.target.value; updateLivePreview(); });
    document.getElementById('bgColor2')?.addEventListener('input', (e) => { cardState.bgColor2 = e.target.value; updateLivePreview(); });
    
    document.getElementById('addCustomSticker')?.addEventListener('click', () => {
        const input = document.getElementById('customSticker');
        if (input && input.value.trim()) { addSticker(input.value.trim()); input.value = ''; }
    });
    
    document.getElementById('photoUpload')?.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => { cardState.photos.push({ data: event.target.result, x: 50, y: 50 }); updateSelectedPhotos(); updateLivePreview(); };
            reader.readAsDataURL(e.target.files[0]);
        }
    });
    
    document.getElementById('buttonPhotoInput')?.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => { cardState.buttonPhoto = event.target.result; updateLivePreview(); document.getElementById('buttonPhotoPreview').innerHTML = `<img src="${cardState.buttonPhoto}" style="width:50px;border-radius:12px">`; };
            reader.readAsDataURL(e.target.files[0]);
        }
    });
    
    document.getElementById('patternUpload')?.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => { cardState.patternData = event.target.result; updateLivePreview(); };
            reader.readAsDataURL(e.target.files[0]);
        }
    });
    
    document.getElementById('clearPattern')?.addEventListener('click', () => { cardState.patternData = null; updateLivePreview(); });
}

function addSticker(emoji) {
    if (cardState.stickers.length >= 30) { alert('Максимум 30'); return; }
    cardState.stickers.push({ emoji: emoji, x: Math.random() * 300, y: Math.random() * 150 });
    updateSelectedStickers();
    updateLivePreview();
}

function removeSticker(index) { cardState.stickers.splice(index, 1); updateSelectedStickers(); updateLivePreview(); }
function removePhoto(index) { cardState.photos.splice(index, 1); updateSelectedPhotos(); updateLivePreview(); }

function updateSelectedStickers() {
    const container = document.getElementById('selectedStickers');
    if (!container) return;
    container.innerHTML = '';
    cardState.stickers.forEach((sticker, i) => {
        const div = document.createElement('div');
        div.className = 'sticker-item';
        div.innerHTML = `${sticker.emoji} <span class="remove" data-index="${i}">✖</span>`;
        container.appendChild(div);
    });
    document.querySelectorAll('.sticker-item .remove').forEach(btn => { btn.addEventListener('click', (e) => { removeSticker(parseInt(btn.dataset.index)); }); });
}

function updateSelectedPhotos() {
    const container = document.getElementById('selectedPhotos');
    if (!container) return;
    container.innerHTML = '';
    cardState.photos.forEach((photo, i) => {
        const div = document.createElement('div');
        div.className = 'photo-item';
        div.innerHTML = `<img src="${photo.data}"><span class="remove-photo" data-index="${i}">✖</span>`;
        container.appendChild(div);
    });
    document.querySelectorAll('.remove-photo').forEach(btn => { btn.addEventListener('click', (e) => { removePhoto(parseInt(btn.dataset.index)); }); });
}

function updateLivePreview() {
    const livePreview = document.getElementById('livePreview');
    if (livePreview) livePreview.style.background = `linear-gradient(135deg, ${cardState.bgColor1}, ${cardState.bgColor2})`;
    
    const liveText = document.getElementById('liveText');
    if (liveText) {
        liveText.textContent = cardState.text || 'Здесь будет ваш текст';
        liveText.style.textAlign = cardState.textCenter ? 'center' : 'left';
        liveText.style.fontWeight = cardState.textBold ? 'bold' : 'normal';
        liveText.style.color = cardState.textColor;
    }
    
    const liveButton = document.getElementById('liveButton');
    if (liveButton) {
        liveButton.textContent = cardState.buttonText;
        if (cardState.buttonPhoto) {
            liveButton.style.background = `url(${cardState.buttonPhoto}) center/cover`;
        } else {
            liveButton.style.background = `linear-gradient(135deg, ${cardState.buttonBgColor}, ${cardState.buttonBgColor})`;
        }
        liveButton.style.color = cardState.buttonTextColor;
        liveButton.style.padding = `${parseInt(cardState.buttonSize) * 0.3}px ${parseInt(cardState.buttonSize)}px`;
        liveButton.style.fontSize = `${parseInt(cardState.buttonSize) * 0.4}px`;
        if (cardState.buttonStyle === 'rounded') liveButton.style.borderRadius = '60px';
        else if (cardState.buttonStyle === 'square') liveButton.style.borderRadius = '12px';
        else if (cardState.buttonStyle === 'glow') liveButton.style.boxShadow = `0 0 20px ${cardState.buttonBgColor}`;
    }
    
    const liveStickers = document.getElementById('liveStickers');
    if (liveStickers) {
        liveStickers.innerHTML = '';
        cardState.stickers.forEach(sticker => { const span = document.createElement('span'); span.textContent = sticker.emoji; span.style.fontSize = '30px'; span.style.margin = '0 5px'; liveStickers.appendChild(span); });
    }
    
    const livePhotos = document.getElementById('livePhotos');
    if (livePhotos) {
        livePhotos.innerHTML = '';
        cardState.photos.forEach(photo => { const img = document.createElement('img'); img.src = photo.data; img.style.width = `${cardState.photoSize}px`; img.style.height = `${cardState.photoSize}px`; img.style.objectFit = 'cover'; img.style.borderRadius = '12px'; img.style.margin = '0 5px'; livePhotos.appendChild(img); });
    }
    
    const patternContainer = document.getElementById('livePattern');
    if (patternContainer && cardState.patternData) {
        patternContainer.innerHTML = '';
        const cols = Math.ceil(500 / cardState.patternSize);
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
            patternContainer.appendChild(img);
        }
    }
}

function saveCard() {
    const textArea = document.getElementById('cardText');
    if (textArea && textArea.value.trim()) cardState.text = textArea.value.trim();
    if (!cardState.text) { alert('Напишите текст!'); return; }
    
    const isPrivate = document.getElementById('isPrivate')?.checked || false;
    
    if (window.addPost) {
        window.addPost(cardState, isPrivate);
        alert('✨ Открытка создана и опубликована в ленте!');
        window.location.href = 'index.html';
    } else {
        alert('Ошибка сохранения');
    }
}