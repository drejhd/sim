import { BodyPartType, BodyPartPreset } from '../types';
import { PresetManager } from './PresetManager';

export class BodyEditor {
    private mainCanvas: HTMLCanvasElement;
    private mainCtx: CanvasRenderingContext2D;
    private miniCanvas: HTMLCanvasElement;
    private miniCtx: CanvasRenderingContext2D;
    private presetManager: PresetManager;
    private selectedPart: BodyPartType | null = null;
    private isDrawing = false;
    private skinLayer: ImageData | null = null;
    private parts: Map<BodyPartType, BodyPartPreset> = new Map();
    private currentStage: string = 'body';
    private selectedSubcategory: string = 'head'; // для хранения выбранной подкатегории

    // Категории и их детальные части
    private categoryMap: Record<string, { 
        title: string, 
        subcategories?: { label: string, parts: BodyPartType[] }[],
        parts?: BodyPartType[] 
    }> = {
        head: {
            title: 'Части головы',
            subcategories: [
                { label: 'Голова', parts: ['head'] },
                { label: 'Уши', parts: ['ear_l', 'ear_r'] }
            ]
        },
        torso: {
            title: 'Части тела',
            parts: ['torso']
        },
        arm: {
            title: 'Части руки',
            subcategories: [
                { label: 'Левая', parts: ['shoulder_l', 'forearm_l', 'hand_l'] },
                { label: 'Правая', parts: ['shoulder_r', 'forearm_r', 'hand_r'] }
            ]
        },
        leg: {
            title: 'Части ноги',
            subcategories: [
                { label: 'Левая', parts: ['thigh_l', 'calf_l', 'foot_l'] },
                { label: 'Правая', parts: ['thigh_r', 'calf_r', 'foot_r'] }
            ]
        }
    };

    private selectedCategory: string = 'head';

    constructor() {
        this.mainCanvas = document.getElementById('editorCanvas') as HTMLCanvasElement;
        this.mainCtx = this.mainCanvas.getContext('2d')!;
        this.miniCanvas = document.getElementById('miniCanvas') as HTMLCanvasElement;
        this.miniCtx = this.miniCanvas.getContext('2d')!;
        this.presetManager = new PresetManager();
        
        this.setupUI();
        this.initDefaultBody();
        this.setupStageListeners();
    }

        private setupStageListeners() {
        // Слушаем изменения этапов через кастомное событие
        document.addEventListener('stageChanged', ((e: CustomEvent) => {
            const stage = e.detail.stage;
            this.currentStage = stage;
            this.onStageChanged(stage);
        }) as EventListener);
    }

    private onStageChanged(stage: string) {
        // Обновляем UI в зависимости от этапа
        switch(stage) {
            case 'body':
                this.setDrawingEnabled(false);
                this.renderBodyPartsGrid(this.selectedCategory);
                this.renderMainCanvas();
                break;
            case 'skin':
                this.setDrawingEnabled(true);
                this.prepareSkinDrawing();
                break;
            case 'details':
                this.setDrawingEnabled(false);
                this.renderDetails();
                break;
            case 'clothes':
                this.setDrawingEnabled(false);
                this.renderClothes();
                break;
        }
    }

    private setDrawingEnabled(enabled: boolean) {
        // Меняем курсор
        this.mainCanvas.style.cursor = enabled ? 'crosshair' : 'default';
        
        // Включаем/отключаем события (через флаг)
        this.isDrawingEnabled = enabled;
    }

    // Добавляем флаг в класс
    private isDrawingEnabled = false;

    private renderBodyPartsGrid(category: string) {
        const grid = document.getElementById('bodyPartsGrid')!;
        const title = document.getElementById('categoryTitle')!;
        const tabsContainer = document.getElementById('subcategoryTabs')!;
        const categoryData = this.categoryMap[category];
        
        if (!categoryData) return;
        
        title.textContent = categoryData.title;
        
        // Проверяем, есть ли подкатегории
        const hasSubcategories = categoryData.subcategories && categoryData.subcategories.length > 0;
        
        if (hasSubcategories) {
            // Показываем вкладки
            tabsContainer.style.display = 'flex';
            
            // Рендерим вкладки
            const subcategories = categoryData.subcategories!;
            tabsContainer.innerHTML = subcategories.map((sub, index) => `
                <button class="subcategory-tab ${index === 0 ? 'active' : ''}" 
                        data-sub="${sub.label}">
                    ${sub.label}
                </button>
            `).join('');
            
            // Выбираем первую подкатегорию по умолчанию
            this.selectedSubcategory = subcategories[0].label;
            
            // Обработчики вкладок
            tabsContainer.querySelectorAll('.subcategory-tab').forEach(el => {
                el.addEventListener('click', () => {
                    tabsContainer.querySelectorAll('.subcategory-tab').forEach(b => b.classList.remove('active'));
                    el.classList.add('active');
                    this.selectedSubcategory = el.getAttribute('data-sub') || '';
                    this.renderPartsForSubcategory(category, this.selectedSubcategory);
                });
            });
            
            // Рендерим части для первой подкатегории
            this.renderPartsForSubcategory(category, this.selectedSubcategory);
            
        } else {
            // Скрываем вкладки
            tabsContainer.style.display = 'none';
            
            // Используем обычные части
            const parts = categoryData.parts || [];
            this.renderPartsList(parts);
        }
    }

    private renderPartsForSubcategory(category: string, subcategoryLabel: string) {
        const categoryData = this.categoryMap[category];
        if (!categoryData || !categoryData.subcategories) return;
        
        const subcategory = categoryData.subcategories.find(s => s.label === subcategoryLabel);
        if (!subcategory) return;
        
        this.renderPartsList(subcategory.parts);
        
        // автоматически выбираем первую часть
        if (subcategory.parts && subcategory.parts.length > 0) {
            this.selectPart(subcategory.parts[0]);
        }
    }

private renderPartsList(parts: BodyPartType[]) {
    const grid = document.getElementById('bodyPartsGrid')!;
    
    const partNames: Record<BodyPartType, string> = {
        head: 'Голова',
        torso: 'Тело',
        shoulder_l: 'Плечо',
        shoulder_r: 'Плечо',
        forearm_l: 'Предплечье',
        forearm_r: 'Предплечье',
        hand_l: 'Кисть',
        hand_r: 'Кисть',
        thigh_l: 'Бедро',
        thigh_r: 'Бедро',
        calf_l: 'Голень',
        calf_r: 'Голень',
        foot_l: 'Стопа',
        foot_r: 'Стопа',
        ear_l: 'Левое ухо',
        ear_r: 'Правое ухо'
    };
    
    if (parts.length === 0) {
        grid.innerHTML = `<div class="empty-message">Нет доступных частей</div>`;
        return;
    }
    
    grid.innerHTML = parts.map(part => `
        <button class="body-part-btn ${this.selectedPart === part ? 'active' : ''}" 
                data-part="${part}">
            ${partNames[part] || part}
        </button>
    `).join('');
    
    grid.querySelectorAll('.body-part-btn').forEach(el => {
        el.addEventListener('click', () => {
            const part = el.getAttribute('data-part') as BodyPartType;
            this.selectPart(part);
        });
    });

    if (!this.selectedPart || !parts.includes(this.selectedPart)) {
        if (parts.length > 0) {
            this.selectPart(parts[0]);
        }
    }
}

    private prepareSkinDrawing() {
        // Активируем рисование на коже
        const colorPicker = document.getElementById('skinColorPicker') as HTMLInputElement;
        const brushSize = document.getElementById('skinBrushSize') as HTMLInputElement;
        const sizeLabel = document.getElementById('skinSizeLabel')!;

        if (brushSize) {
            brushSize.addEventListener('input', () => {
                sizeLabel.textContent = `${brushSize.value}px`;
            });
        }

        // Очистка кожи
        document.getElementById('clearSkinBtn')?.addEventListener('click', () => {
            if (confirm('Очистить все рисунки на коже?')) {
                this.skinLayer = null;
                this.renderMainCanvas();
            }
        });
    }

    private renderDetails() {
        // Заполняем пресеты деталей
        const container = document.getElementById('detailPresets')!;
        const detailTypes = ['eyes', 'mouth', 'hair', 'nose', 'ears', 'eyebrows'];
        
        container.innerHTML = detailTypes.map(type => `
            <div class="detail-preset-item" data-detail="${type}">
                <div class="detail-preview" style="background:#f0e8e3;border-radius:8px;padding:10px;text-align:center;">
                    <span style="font-size:32px;">${this.getDetailIcon(type)}</span>
                </div>
                <span>${this.getDetailName(type)}</span>
            </div>
        `).join('');

        // Обработчики выбора деталей
        container.querySelectorAll('.detail-preset-item').forEach(el => {
            el.addEventListener('click', () => {
                container.querySelectorAll('.detail-preset-item').forEach(e => e.classList.remove('active'));
                el.classList.add('active');
                const detail = el.getAttribute('data-detail');
                this.selectDetail(detail);
            });
        });
    }

    private getDetailIcon(type: string): string {
        const icons: Record<string, string> = {
            eyes: '👀',
            mouth: '👄',
            hair: '💇',
            nose: '👃',
            ears: '👂',
            eyebrows: '🤨'
        };
        return icons[type] || '❓';
    }

    private getDetailName(type: string): string {
        const names: Record<string, string> = {
            eyes: 'Глаза',
            mouth: 'Рот',
            hair: 'Волосы',
            nose: 'Нос',
            ears: 'Уши',
            eyebrows: 'Брови'
        };
        return names[type] || type;
    }

    private selectDetail(detail: string | null) {
        console.log(`🎯 Выбрана деталь: ${detail}`);
        // Здесь будет логика загрузки пресетов деталей
    }

    private renderClothes() {
        // Заполняем пресеты одежды
        const container = document.getElementById('clothesPresets')!;
        const clothesTypes = ['top', 'bottom', 'shoes', 'accessories'];
        
        container.innerHTML = clothesTypes.map(type => `
            <div class="clothes-preset-item" data-clothes="${type}">
                <div class="clothes-preview" style="background:#f0e8e3;border-radius:8px;padding:10px;text-align:center;">
                    <span style="font-size:32px;">${this.getClothesIcon(type)}</span>
                </div>
                <span>${this.getClothesName(type)}</span>
            </div>
        `).join('');

        // Обработчики выбора одежды
        container.querySelectorAll('.clothes-preset-item').forEach(el => {
            el.addEventListener('click', () => {
                container.querySelectorAll('.clothes-preset-item').forEach(e => e.classList.remove('active'));
                el.classList.add('active');
                const clothes = el.getAttribute('data-clothes');
                this.selectClothes(clothes);
            });
        });
    }

    private getClothesIcon(type: string): string {
        const icons: Record<string, string> = {
            top: '👕',
            bottom: '👖',
            shoes: '👟',
            accessories: '💎'
        };
        return icons[type] || '❓';
    }

    private getClothesName(type: string): string {
        const names: Record<string, string> = {
            top: 'Верх',
            bottom: 'Низ',
            shoes: 'Обувь',
            accessories: 'Аксессуары'
        };
        return names[type] || type;
    }

    private selectClothes(clothes: string | null) {
        console.log(`👔 Выбрана одежда: ${clothes}`);
        // Здесь будет логика загрузки пресетов одежды
    }

    public init() {
        this.renderMainCanvas();
        this.renderBodyPartsGrid('head');
        const firstPart = this.categoryMap['head'];
        if (firstPart.subcategories && firstPart.subcategories.length > 0) {
            const firstSub = firstPart.subcategories[0];
            if (firstSub.parts && firstSub.parts.length > 0) {
                this.selectPart(firstSub.parts[0]);
            }
        }
        this.setDrawingEnabled(false);
        console.log('BodyEditor инициализирован');
    }
    
    private setupUI() {
        // Выбор части тела из списка справа
        document.querySelectorAll('.body-part-selector').forEach(el => {
            const btn = el as HTMLElement;
            btn.addEventListener('click', () => {
                const part = btn.dataset.part as BodyPartType;
                this.selectPart(part);
            });
        });

        // Выбор категории (левая панель)
        document.querySelectorAll('.part-icon').forEach(el => {
            const btn = el as HTMLElement;
            btn.addEventListener('click', () => {
                document.querySelectorAll('.part-icon').forEach(b => {
                    b.classList.remove('active');
                    b.setAttribute('aria-selected', 'false');
                });
                btn.classList.add('active');
                btn.setAttribute('aria-selected', 'true');
                
                const category = btn.dataset.category as string;
                this.selectedCategory = category;
                this.renderBodyPartsGrid(category);
                
                // Выбираем первую часть в категории
                const categoryData = this.categoryMap[category];
                if (categoryData) {
                    let firstPart: BodyPartType | null = null;
                    
                    // Если есть подкатегории — берем из первой
                    if (categoryData.subcategories && categoryData.subcategories.length > 0) {
                        const firstSub = categoryData.subcategories[0];
                        if (firstSub.parts && firstSub.parts.length > 0) {
                            firstPart = firstSub.parts[0];
                        }
                    } 
                    // Если есть обычные parts
                    else if (categoryData.parts && categoryData.parts.length > 0) {
                        firstPart = categoryData.parts[0];
                    }
                    
                    if (firstPart) {
                        this.selectPart(firstPart);
                    }
                }
            });
        });
        
        // Рисование на основном холсте (ограничено телом)
        this.mainCanvas.addEventListener('mousedown', (e) => this.startDraw(e));
        this.mainCanvas.addEventListener('mousemove', (e) => this.draw(e));
        this.mainCanvas.addEventListener('mouseup', () => this.endDraw());
        this.mainCanvas.addEventListener('mouseleave', () => this.endDraw());
        
        // Рисование на мини-холсте
        this.miniCanvas.addEventListener('mousedown', (e) => this.startDrawMini(e));
        this.miniCanvas.addEventListener('mousemove', (e) => this.drawMini(e));
        this.miniCanvas.addEventListener('mouseup', () => this.endDraw());
        this.miniCanvas.addEventListener('mouseleave', () => this.endDraw());
    }
    
    private selectPart(part: BodyPartType) {
        this.selectedPart = part;
        
        // Подсвечиваем выбранную часть
        document.querySelectorAll('.body-part-btn').forEach(el => {
            el.classList.remove('active');
        });
        document.querySelector(`.body-part-btn[data-part="${part}"]`)?.classList.add('active');

        // Показываем пресеты для этой части
        this.renderPresetsForPart(part);
        
        // Обновляем мини-холст
        this.updateMiniCanvas(part);
    }
    
    private renderPresetsForPart(part: BodyPartType) {
        const container = document.getElementById('presetGrid')!;
        const presets = this.presetManager.getPresets(part);
        
        container.innerHTML = presets.map(p => `
            <div class="preset-item" data-preset="${p.id}">
                <img src="${p.preview}" alt="${p.name}">
                <span>${p.name}</span>
            </div>
        `).join('');
        
        // Добавляем обработчики для выбора пресета
        container.querySelectorAll('.preset-item').forEach(el => {
            el.addEventListener('click', () => {
                const id = el.getAttribute('data-preset');
                const preset = presets.find(p => p.id === id);
                if (preset) {
                    this.applyPreset(preset);
                }
            });
        });
    }
    
    private applyPreset(preset: BodyPartPreset) {
        // Применяем пресет к выбранной части
        this.parts.set(preset.type, preset);
        this.renderMainCanvas();
    }
    
    private initDefaultBody() {
        // Создаем тело по умолчанию с базовыми пресетами
        const types: BodyPartType[] = ['head', 'torso', 'shoulder_l', 'shoulder_r', 'forearm_l', 'forearm_r', 'hand_l', 'hand_r', 'thigh_l', 'thigh_r', 'calf_l', 'calf_r', 'foot_l', 'foot_r'];
        
        types.forEach(type => {
            const presets = this.presetManager.getPresets(type);
            if (presets.length > 0) {
                this.parts.set(type, presets[0]);
            }
        });
        
        this.renderMainCanvas();
    }
    
    private renderMainCanvas() {
        const ctx = this.mainCtx;
        ctx.clearRect(0, 0, this.mainCanvas.width, this.mainCanvas.height);
        
        // Рисуем все части тела
        const drawOrder: BodyPartType[] = [
            'shoulder_l', 'shoulder_r', 'forearm_l', 'forearm_r', 'hand_l', 'hand_r',
            'thigh_l', 'thigh_r', 'calf_l', 'calf_r', 'foot_l', 'foot_r',
            'torso', 'head'
        ];
        
        drawOrder.forEach(type => {
            const part = this.parts.get(type);
            if (part && part.imageData) {
                // Временное решение - рисуем из ImageData
                this.drawImageData(ctx, part.imageData, 0, 0);
            }
        });
        
        // Рисуем слой кожи (тату, пятна) поверх тела
        if (this.skinLayer) {
            this.mainCtx.putImageData(this.skinLayer, 0, 0);
        }
        
        // Рисуем подсветку выбранной части
        if (this.selectedPart) {
            const selected = this.parts.get(this.selectedPart);
            if (selected) {
                ctx.strokeStyle = 'rgba(233, 69, 96, 0.5)';
                ctx.lineWidth = 3;
                ctx.strokeRect(0, 0, this.mainCanvas.width, this.mainCanvas.height);
            }
        }
    }
    
    private drawImageData(ctx: CanvasRenderingContext2D, imageData: ImageData, x: number, y: number) {
        // Временный canvas для преобразования ImageData в изображение
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = imageData.width;
        tempCanvas.height = imageData.height;
        const tempCtx = tempCanvas.getContext('2d')!;
        tempCtx.putImageData(imageData, 0, 0);
        ctx.drawImage(tempCanvas, x, y);
    }
    
    private updateMiniCanvas(part: BodyPartType) {
        // Показываем выбранную часть на мини-холсте
        const partData = this.parts.get(part);
        if (partData && partData.imageData) {
            this.miniCtx.clearRect(0, 0, this.miniCanvas.width, this.miniCanvas.height);
            this.drawImageData(this.miniCtx, partData.imageData, 0, 0);
        } else {
            this.miniCtx.clearRect(0, 0, this.miniCanvas.width, this.miniCanvas.height);
            this.miniCtx.fillStyle = '#f0e8e3';
            this.miniCtx.fillRect(0, 0, this.miniCanvas.width, this.miniCanvas.height);
            this.miniCtx.fillStyle = '#b0a8b8';
            this.miniCtx.font = '14px sans-serif';
            this.miniCtx.textAlign = 'center';
            this.miniCtx.fillText('Выберите часть', this.miniCanvas.width/2, this.miniCanvas.height/2);
        }
    }
    
    // Методы рисования на основном холсте (с ограничением по контуру)
    private startDraw(e: MouseEvent) {
        if (!this.isDrawingEnabled || !this.selectedPart) return;
        this.isDrawing = true;
        this.saveHistory();
        this.draw(e);
    }
    
    private draw(e: MouseEvent) {
        if (!this.isDrawingEnabled || !this.selectedPart || !this.isDrawingEnabled) return;
        
        const rect = this.mainCanvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (this.mainCanvas.width / rect.width);
        const y = (e.clientY - rect.top) * (this.mainCanvas.height / rect.height);
        
        // Проверяем, находится ли точка внутри тела
        if (!this.isInsideBody(x, y)) return;
        
        const ctx = this.mainCtx;
        const color = document.getElementById('colorPicker') as HTMLInputElement;
        const size = parseInt((document.getElementById('brushSize') as HTMLInputElement).value);
        
        ctx.fillStyle = color.value;
        ctx.beginPath();
        ctx.arc(x, y, size/2, 0, Math.PI * 2);
        ctx.fill();
        
        // Сохраняем слой кожи
        this.skinLayer = ctx.getImageData(0, 0, this.mainCanvas.width, this.mainCanvas.height);
    }
    
    private endDraw() {
        if (this.currentStage === 'body') return;
        this.isDrawing = false;
    }
    
    private isInsideBody(x: number, y: number): boolean {
        // Проверяем, находится ли точка внутри любого контура тела
        // Простая проверка - смотрим цвет пикселя на позиции
        const ctx = this.mainCtx;
        const imageData = ctx.getImageData(x, y, 1, 1);
        const data = imageData.data;
        
        // Если пиксель не прозрачный (не белый фон) - значит внутри тела
        return !(data[0] > 240 && data[1] > 240 && data[2] > 240);
    }
    
    private startDrawMini(e: MouseEvent) {
        // Аналогично рисованию на мини-холсте
        // Рисуем только на элементе, не на теле
        // ...
    }
    
    private drawMini(e: MouseEvent) {
        // Рисование на мини-холсте
    }
    
    private saveHistory() {
        // Сохранение истории для отмены
    }
    
    public getBodyData() {
        return {
            parts: this.parts,
            skinLayer: this.skinLayer
        };
    }
}