/**
 * АРХИТЕКТУРА БЕЗСЕРВЕРНОЙ СОЦИАЛЬНОЙ СЕТИ (0_0)otkoiminyashkaa
 * Все данные открытки упаковываются в хэш ссылки через Base64 кодирование.
 * Получатель открывает ссылку и скрипт мгновенно восстанавливает объект.
 */

// Системное состояние редактора по умолчанию
let cardState = {
    text: 'Поздравляю с праздником! Всего самого милого и прекрасного! ✨',
    font: 'font-sans',
    align: true,
    bold: false,
    size: 24,
    color: '#2c2c2c',
    btnText: 'Открыть открытку 💌',
    btnBg: '#faceb1',
    btnColor: '#ffffff',
    buttonStyle: 'rounded',
    btnSize: 16,
    btnPhoto: null,
    bg1: '#faceb1',
    bg2: '#ffa58a',
    pattern: null,
    pSize: 50,
    pOp: 40,
    items: [], // Декоративные подвижные каомодзи и фото
    anim: 'gift'
};

const defaultKaomojis = ["(0_0)", "(◕‿◕✿)", "(✿◠‿◠)", "ᕕ( ᐛ )ᕗ", "(=^･^=)", "(｡♥‿♥｡)", "🛸", "🌸", "✨", "💫"];

document.addEventListener('DOMContentLoaded', () => {
    // Проверяем: мы создаем открытку или перешли по ссылке на просмотр?
    const urlParams = new URLSearchParams(window.location.search);
    const cardDataHash = urlParams.get('c');

    if (cardDataHash) {
        // РЕЖИМ ПРОСМОТРА ГОТОВОЙ ОТКРЫТКИ
        document.getElementById('editorModeZone').style.display = 'none';
        document.getElementById('viewModeZone').style.display = 'flex';
        renderSharedCard(cardDataHash);
    } else {
        // РЕЖИМ СБОРОЧНОГО ЦЕХА
        document.getElementById('editorModeZone').style.display = 'grid';
        document.getElementById('viewModeZone').style.display = 'none';
        initEditorEngine();
        renderKaomojisGrid();
        updateLivePreview();
    }
});

// Рендеринг сетки каомодзи в панели декора
function renderKaomojisGrid() {
    const container = document.getElementById('kaomojiContainer');
    container.innerHTML = defaultKaomojis.map(k => `
        <button class="km-btn" onclick="addDecorationItem('kaomoji', '${k}')">${k}</button>
    `).join('');
}

// Добавление новой наклейки на интерактивный холст
function addDecorationItem(type, content) {
    const id = Date.now() + Math.random();
    const size = type === 'photo' ? document.getElementById('photoSizeRange').value : 32;
    
    cardState.items.push({
        id, type, content,
        x: 35, y: 40, // Начальные координаты по центру холста в %
        size: parseInt(size)
    });
    
    updateLivePreview();
}

// Инициализация обработчиков изменений во вкладках конструктора
function initEditorEngine() {
    // Переключение вкладок (Табы)
    document.querySelectorAll('.ed-tab-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.ed-tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.ed-tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.edtab).classList.add('active');
        };
    });

    // Связывание Input-элементов с объектом состояния cardState
    const bindInput = (id, stateKey, eventType = 'input', isCheckbox = false) => {
        const el = document.getElementById(id);
        el.addEventListener(eventType, e => {
            cardState[stateKey] = isCheckbox ? e.target.checked : e.target.value;
            updateLivePreview();
        });
    };

    bindInput('cardText', 'text');
    bindInput('cardFont', 'font', 'change');
    bindInput('textCenter', 'align', 'change', true);
    bindInput('textBold', 'bold', 'change', true);
    bindInput('textSize', 'size');
    bindInput('textColor', 'color');
    bindInput('buttonText', 'btnText');
    bindInput('buttonStyle', 'buttonStyle', 'change');
    bindInput('buttonSize', 'btnSize');
    bindInput('buttonBgColor', 'btnBg');
    bindInput('buttonTextColor', 'btnColor');
    bindInput('bgColor1', 'bg1');
    bindInput('bgColor2', 'bg2');
    bindInput('patternSize', 'pSize');
    bindInput('patternOpacity', 'pOp');
    bindInput('animationType', 'anim', 'change');

    // Кнопка добавления кастомного каомодзи/символа
    document.getElementById('addCustomEmojiBtn').onclick = () => {
        const input = document.getElementById('customEmoji');
        const val = input.value.trim();
        if (val) {
            addDecorationItem('kaomoji', val);
            input.value = '';
        }
    };

    // Чтение файлов (Фото на кнопку, узор, фото в открытку) через FileReader в Base64
    const initFileReader = (inputId, callback) => {
        document.getElementById(inputId).onchange = e => {
            if (e.target.files && e.target.files[0]) {
                const reader = new FileReader();
                reader.onload = ev => callback(ev.target.result);
                reader.readAsDataURL(e.target.files[0]);
            }
        };
    };

    initFileReader('btnPhotoInput', b64 => { cardState.btnPhoto = b64; updateLivePreview(); });
    initFileReader('patternInput', b64 => { cardState.pattern = b64; updateLivePreview(); });
    initFileReader('photoInput', b64 => addDecorationItem('photo', b64));

    // Динамическое изменение размеров всех добавленных картинок ползунком
    document.getElementById('photoSizeRange').oninput = (e) => {
        const curSize = e.target.value;
        document.querySelectorAll('#liveMovableZone .draggable-img').forEach(img => {
            img.style.width = curSize + 'px';
            const itemObj = cardState.items.find(x => x.id == img.parentElement.dataset.id);
            if (itemObj) itemObj.size = parseInt(curSize);
        });
    };

    // ГЕНЕРАЦИЯ СЕКРЕТНОЙ ССЫЛКИ ДЛЯ ДРУГА
    document.getElementById('generateLinkBtn').onclick = () => {
        // Сериализуем объект cardState в строку и кодируем в безопасный URL-формат Base64
        const jsonStr = JSON.stringify(cardState);
        const base64Hash = btoa(encodeURIComponent(jsonStr));
        
        const generatedUrl = `${window.location.origin}${window.location.pathname}?c=${base64Hash}`;
        
        document.getElementById('generatedUrlInput').value = generatedUrl;
        document.getElementById('linkResultBlock').style.display = 'block';
    };

    // Копирование в буфер обмена
    document.getElementById('copyUrlBtn').onclick = () => {
        const input = document.getElementById('generatedUrlInput');
        input.select();
        document.execCommand('copy');
        alert('Ссылка скопирована в буфер обмена! Отправьте её получателю 🚀');
    };
}

// Генератор сетки повторяющегося фонового паттерна
function renderPatternLayer(elementId, state) {
    const container = document.getElementById(elementId);
    if (!container) return;
    container.innerHTML = '';
    if (!state.pattern) return;

    // Циклическая укладка мелких плиток паттерна по площади холста
    for (let i = 0; i < 24; i++) {
        const img = document.createElement('img');
        img.src = state.pattern;
        img.style.cssText = `
            position: absolute;
            width: ${state.pSize}px;
            height: ${state.pSize}px;
            opacity: ${state.pOp / 100};
            left: ${(i % 6) * 18}%;
            top: ${Math.floor(i / 6) * 85}px;
            pointer-events: none;
        `;
        container.appendChild(img);
    }
}

// Обновление интерактивного экрана сборки
function updateLivePreview() {
    const st = cardState;
    const stage = document.getElementById('livePreview');
    
    // 1. Градиент
    stage.style.background = `linear-gradient(135deg, ${st.bg1}, ${st.bg2})`;
    
    // 2. Слой узора
    renderPatternLayer('livePattern', st);
    
    // 3. Кастомизация стартовой триггер-кнопки
    const btn = document.getElementById('liveBtn');
    btn.textContent = st.btnText;
    btn.style.color = st.btnColor;
    btn.style.fontSize = st.btnSize + 'px';
    btn.style.background = st.btnPhoto ? `url(${st.btnPhoto}) center/cover` : st.btnBg;
    
    // Стили кнопок
    btn.className = 'card-action-btn ' + (st.buttonStyle === 'glass' ? 'btn-glass' : '');
    btn.style.borderRadius = st.buttonStyle === 'rounded' ? '50px' : st.buttonStyle === 'rect' ? '0px' : '10px';
    btn.style.boxShadow = st.buttonStyle === 'glow' ? `0 0 20px ${st.btnBg}` : 'none';
    btn.style.display = 'inline-block';

    // Сброс скрытого контента при редактировании
    document.getElementById('liveContent').classList.remove('visible');

    // 4. Текст внутри открытки
    const txt = document.getElementById('liveText');
    txt.textContent = st.text;
    txt.style.color = st.color;
    txt.style.fontSize = st.size + 'px';
    txt.className = `card-text ${st.font}`;
    txt.style.textAlign = st.align ? 'center' : 'left';
    txt.style.fontWeight = st.bold ? 'bold' : 'normal';

    // 5. Отрисовка перетаскиваемых элементов декора
    const zone = document.getElementById('liveMovableZone');
    zone.innerHTML = '';
    
    st.items.forEach(item => {
        const el = document.createElement('div');
        el.className = 'draggable-item';
        el.dataset.id = item.id;
        el.style.left = item.x + '%';
        el.style.top = item.y + '%';
        
        if (item.type === 'photo') {
            el.innerHTML = `<img src="${item.content}" class="draggable-img" style="width:${item.size}px;">`;
        } else {
            el.innerHTML = `<span class="draggable-emoji">${item.content}</span>`;
        }
        
        // Включаем Drag & Drop для мышки и тачскринов смартфонов
        bindDragAndDrop(el, item);
        zone.appendChild(el);
    });

    // Навешиваем тестовую анимацию прямо на кнопку в редакторе
    btn.onclick = () => runAnimationEngine('live', st);
}

// Профессиональный Drag & Drop движок с расчетом процентов под адаптивность экрана
function bindDragAndDrop(element, itemReference) {
    let startX = 0, startY = 0, posX = 0, posY = 0;

    const onDragStart = (e) => {
        e = e || window.event;
        startX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
        startY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
        
        document.onmouseup = onDragEnd;
        document.onmousemove = onDragMove;
        document.ontouchend = onDragEnd;
        document.ontouchmove = onDragMove;
    };

    const onDragMove = (e) => {
        e = e || window.event;
        let clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
        let clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
        
        posX = startX - clientX;
        posY = startY - clientY;
        startX = clientX;
        startY = clientY;
        
        let targetTopPercent = ((element.offsetTop - posY) / element.parentElement.clientHeight) * 100;
        let targetLeftPercent = ((element.offsetLeft - posX) / element.parentElement.clientWidth) * 100;
        
        // Ограничиваем рамками холста открытки
        if (targetTopPercent >= 0 && targetTopPercent <= 90) element.style.top = targetTopPercent + "%";
        if (targetLeftPercent >= 0 && targetLeftPercent <= 90) element.style.left = targetLeftPercent + "%";
    };

    const onDragEnd = () => {
        document.onmouseup = null; document.onmousemove = null;
        document.ontouchend = null; document.ontouchmove = null;
        // Перезаписываем финальные координаты обратно в стейт, чтобы они сохранились в ссылке
        itemReference.x = parseFloat(element.style.left);
        itemReference.y = parseFloat(element.style.top);
    };

    element.onmousedown = onDragStart;
    element.ontouchstart = onDragStart;
}

// ЯДРО СЦЕНИЧЕСКОЙ АНИМАЦИИ И ЭФФЕКТОВ ЧАСТИЦ (FX ENGINE)
function runAnimationEngine(prefix, state) {
    document.getElementById(`${prefix}Btn`).style.display = 'none';
    document.getElementById(`${prefix}Content`).classList.add('visible');
    
    const ambientZone = document.getElementById(`${prefix}Ambient`);
    ambientZone.innerHTML = '';
    ambientZone.classList.add('active');
    
    // Активируем фоновое мерцание каомодзи-декораций
    state.items.filter(x => x.type === 'kaomoji').forEach(k => {
        const item = document.createElement('span');
        item.className = 'ambient-emoji';
        item.textContent = k.content;
        item.style.left = k.x + '%';
        item.style.top = k.y + '%';
        ambientZone.appendChild(item);
    });

    const animLayer = document.getElementById(`${prefix}Anim`);
    animLayer.innerHTML = '';

    const fxSymbols = { gift: '🎉', poop: '💩', bouquet: '🌸', fart: '💨' };
    const particleSymbol = fxSymbols[state.anim] || '✨';

    // Проверка на тяжелые физические анимации падения
    if (['gift', 'poop', 'fall'].includes(state.anim)) {
        const heavyObj = document.createElement('div');
        heavyObj.className = 'falling-obj';
        heavyObj.textContent = state.anim === 'gift' ? '🎁' : state.anim === 'poop' ? '💩' : '📦';
        heavyObj.classList.add(state.anim === 'gift' ? 'fx-fall-box' : state.anim === 'poop' ? 'fx-fall-poop' : 'fx-fall-heavy');
        animLayer.appendChild(heavyObj);
    }

    // Взрывной фонтан разлетающихся частиц во все стороны
    setTimeout(() => {
        for (let i = 0; i < 30; i++) {
            const p = document.createElement('div');
            p.className = 'particle';
            p.textContent = particleSymbol;
            p.style.left = '50%';
            p.style.top = '40%';
            
            // Задаем векторы направления взрыва через CSS-переменные
            const dx = (Math.random() - 0.5) * 280;
            const dy = (Math.random() - 0.5) * 280;
            p.style.setProperty('--dx', `${dx}px`);
            p.style.setProperty('--dy', `${dy}px`);
            
            animLayer.appendChild(p);
        }
    }, state.anim === 'poop' ? 650 : 150);
}

// ОТРЕНДЕРИТЬ СГЕНЕРИРОВАННУЮ ССЫЛКУ У ПОЛУЧАТЕЛЯ
function renderSharedCard(hash) {
    try {
        const decodedJson = decodeURIComponent(atob(hash));
        const sharedState = JSON.parse(decodedJson);
        
        const stage = document.getElementById('viewStage');
        stage.style.background = `linear-gradient(135deg, ${sharedState.bg1}, ${sharedState.bg2})`;
        
        renderPatternLayer('viewPattern', sharedState);
        
        const btn = document.getElementById('viewBtn');
        btn.textContent = sharedState.btnText;
        btn.style.color = sharedState.btnColor;
        btn.style.fontSize = sharedState.btnSize + 'px';
        btn.style.background = sharedState.btnPhoto ? `url(${sharedState.btnPhoto}) center/cover` : sharedState.btnBg;
        btn.className = 'card-action-btn ' + (sharedState.buttonStyle === 'glass' ? 'btn-glass' : '');
        btn.style.borderRadius = sharedState.buttonStyle === 'rounded' ? '50px' : sharedState.buttonStyle === 'rect' ? '0px' : '10px';
        btn.style.boxShadow = sharedState.buttonStyle === 'glow' ? `0 0 20px ${sharedState.btnBg}` : 'none';

        const txt = document.getElementById('viewText');
        txt.textContent = sharedState.text;
        txt.style.color = sharedState.color;
        txt.style.fontSize = sharedState.size + 'px';
        txt.className = `card-text ${sharedState.font}`;
        txt.style.textAlign = sharedState.align ? 'center' : 'left';
        txt.style.fontWeight = sharedState.bold ? 'bold' : 'normal';

        const zone = document.getElementById('viewMovableZone');
        zone.innerHTML = '';
        
        sharedState.items.forEach(item => {
            const el = document.createElement('div');
            el.className = 'draggable-item';
            el.style.left = item.x + '%';
            el.style.top = item.y + '%';
            el.style.pointerEvents = 'none'; // На экране просмотра получатель просто созерцает композицию
            
            if (item.type === 'photo') {
                el.innerHTML = `<img src="${item.content}" style="width:${item.size}px; border-radius:8px; box-shadow:0 4px 10px rgba(0,0,0,0.15);">`;
            } else {
                el.innerHTML = `<span style="font-size:32px; text-shadow:0 2px 4px rgba(0,0,0,0.1);">${item.content}</span>`;
            }
            zone.appendChild(el);
        });

        btn.onclick = () => runAnimationEngine('view', sharedState);

    } catch (e) {
        alert('Упс! Не удалось прочитать открытку. Похоже, ссылка повреждена.');
        window.location.search = '';
    }
}