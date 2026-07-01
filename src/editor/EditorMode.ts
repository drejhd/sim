import { PartType, Tool, CreaturePreset } from '../types';

export class EditorMode {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private activePart: PartType = 'head';
    private activeTool: Tool = 'pencil';
    private color: string = '#b8a9c9';
    private brushSize: number = 4;
    private isDrawing = false;
    private currentLayer: ImageData | null = null;
    private layers: Map<PartType, ImageData> = new Map();
    private presets: CreaturePreset[] = [];
    private showGrid = true;
    private showSilhouette = true;
    private history: ImageData[] = [];
    private historyIndex = -1;

    constructor() {
        this.canvas = document.getElementById('editorCanvas') as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d')!;
        
        this.setupUI();
        this.loadPresets(); // Загружаем пресеты при создании
        this.clearCanvas();
        this.renderPresets();
    }

    private setupUI() {
        // Части тела (левая панель)
        document.querySelectorAll('.part-icon').forEach(el => {
            const btn = el as HTMLElement;
            btn.addEventListener('click', () => {
                document.querySelectorAll('.part-icon').forEach(b => (b as HTMLElement).classList.remove('active'));
                document.querySelectorAll('.part-icon').forEach(b => (b as HTMLElement).setAttribute('aria-selected', 'false'));
                btn.classList.add('active');
                btn.setAttribute('aria-selected', 'true');
                this.activePart = btn.dataset.part as PartType;
                this.switchPart(this.activePart);
                this.updateDetailTabs();
            });
        });

        // Вкладки настроек
        document.querySelectorAll('.settings-tab').forEach(el => {
            const tab = el as HTMLElement;
            tab.addEventListener('click', () => {
                document.querySelectorAll('.settings-tab').forEach(t => {
                    (t as HTMLElement).classList.remove('active');
                    (t as HTMLElement).setAttribute('aria-selected', 'false');
                });
                document.querySelectorAll('.settings-content').forEach(c => (c as HTMLElement).classList.remove('active'));
                tab.classList.add('active');
                tab.setAttribute('aria-selected', 'true');
                const target = document.getElementById(tab.dataset.tab + 'Tab')!;
                target.classList.add('active');
            });
        });

        // Инструменты
        document.querySelectorAll('.tool-btn').forEach(el => {
            const btn = el as HTMLElement;
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tool-btn').forEach(b => (b as HTMLElement).classList.remove('active'));
                btn.classList.add('active');
                this.activeTool = btn.dataset.tool as Tool;
            });
        });

        // Цвет
        const colorPicker = document.getElementById('colorPicker') as HTMLInputElement;
        colorPicker.addEventListener('input', (e) => {
            this.color = (e.target as HTMLInputElement).value;
        });

        // Размер кисти
        const brushSize = document.getElementById('brushSize') as HTMLInputElement;
        const sizeLabel = document.getElementById('sizeLabel')!;
        brushSize.addEventListener('input', (e) => {
            this.brushSize = parseInt((e.target as HTMLInputElement).value);
            sizeLabel.textContent = `${this.brushSize}px`;
        });

        // Toggle'ы
        const gridToggle = document.getElementById('gridToggle') as HTMLInputElement;
        gridToggle.addEventListener('change', (e) => {
            this.showGrid = (e.target as HTMLInputElement).checked;
            this.render();
        });

        const silhouetteToggle = document.getElementById('silhouetteToggle') as HTMLInputElement;
        silhouetteToggle.addEventListener('change', (e) => {
            this.showSilhouette = (e.target as HTMLInputElement).checked;
            this.render();
        });

        // Кнопки
        document.getElementById('undoBtn')?.addEventListener('click', () => this.undo());
        document.getElementById('clearBtn')?.addEventListener('click', () => this.clearCanvas());
        document.getElementById('savePresetBtn')?.addEventListener('click', () => this.savePreset());
        document.getElementById('saveCreatureBtn')?.addEventListener('click', () => this.saveCreature());

        // События холста
        this.canvas.addEventListener('mousedown', (e) => this.startDraw(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', () => this.endDraw());
        this.canvas.addEventListener('mouseleave', () => this.endDraw());

        // Инициализация детальных вкладок
        this.updateDetailTabs();
    }

    private switchPart(part: PartType) {
        // Сохраняем текущий слой
        if (this.currentLayer) {
            this.layers.set(this.activePart, this.currentLayer);
        }

        // Загружаем новый
        const saved = this.layers.get(part);
        if (saved) {
            this.currentLayer = saved;
            this.render();
        } else {
            this.clearCanvas();
        }
    }

    private startDraw(e: MouseEvent) {
        if (this.activeTool === 'select') return;
        this.isDrawing = true;
        this.saveHistory();
        this.draw(e);
    }

    private draw(e: MouseEvent) {
        if (!this.isDrawing) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const x = Math.round((e.clientX - rect.left) * scaleX);
        const y = Math.round((e.clientY - rect.top) * scaleY);
        
        if (x < 0 || y < 0 || x >= this.canvas.width || y >= this.canvas.height) return;

        const ctx = this.ctx;
        const color = this.activeTool === 'eraser' ? '#fcf9f7' : this.color;
        const size = this.brushSize;

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, size / 2, 0, Math.PI * 2);
        ctx.fill();

        this.currentLayer = ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    }

    private endDraw() {
        if (this.isDrawing) {
            this.isDrawing = false;
            if (this.currentLayer) {
                this.layers.set(this.activePart, this.currentLayer);
            }
        }
    }

    private saveHistory() {
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        this.history = this.history.slice(0, this.historyIndex + 1);
        this.history.push(imageData);
        this.historyIndex = this.history.length - 1;
        if (this.history.length > 30) {
            this.history.shift();
            this.historyIndex--;
        }
    }

    private undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            const data = this.history[this.historyIndex];
            this.ctx.putImageData(data, 0, 0);
            this.currentLayer = data;
            this.layers.set(this.activePart, data);
        }
    }

    private clearCanvas() {
        this.ctx.fillStyle = '#fcf9f7';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.currentLayer = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        this.layers.set(this.activePart, this.currentLayer);
        this.render();
        this.saveHistory();
    }

    private render() {
        // Рисуем текущий слой
        if (this.currentLayer) {
            this.ctx.putImageData(this.currentLayer, 0, 0);
        }

        // Сетка
        if (this.showGrid) {
            this.ctx.strokeStyle = 'rgba(200, 190, 185, 0.3)';
            this.ctx.lineWidth = 0.5;
            for (let x = 0; x <= this.canvas.width; x += 20) {
                this.ctx.beginPath();
                this.ctx.moveTo(x, 0);
                this.ctx.lineTo(x, this.canvas.height);
                this.ctx.stroke();
            }
            for (let y = 0; y <= this.canvas.height; y += 20) {
                this.ctx.beginPath();
                this.ctx.moveTo(0, y);
                this.ctx.lineTo(this.canvas.width, y);
                this.ctx.stroke();
            }
        }

        // Силуэт
        if (this.showSilhouette) {
            this.ctx.strokeStyle = 'rgba(200, 190, 185, 0.2)';
            this.ctx.lineWidth = 1;
            this.ctx.setLineDash([5, 5]);
            
            const cx = this.canvas.width / 2;
            // Голова
            this.ctx.beginPath();
            this.ctx.arc(cx, 100, 35, 0, Math.PI * 2);
            this.ctx.stroke();
            // Тело
            this.ctx.beginPath();
            this.ctx.moveTo(cx - 30, 140);
            this.ctx.lineTo(cx - 25, 260);
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.moveTo(cx + 30, 140);
            this.ctx.lineTo(cx + 25, 260);
            this.ctx.stroke();
            // Ноги
            this.ctx.beginPath();
            this.ctx.moveTo(cx - 20, 260);
            this.ctx.lineTo(cx - 35, 350);
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.moveTo(cx + 20, 260);
            this.ctx.lineTo(cx + 35, 350);
            this.ctx.stroke();
            // Руки
            this.ctx.beginPath();
            this.ctx.moveTo(cx - 25, 160);
            this.ctx.lineTo(cx - 55, 220);
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.moveTo(cx + 25, 160);
            this.ctx.lineTo(cx + 55, 220);
            this.ctx.stroke();
            
            this.ctx.setLineDash([]);
        }
    }

    private updateDetailTabs() {
        const container = document.getElementById('detailTabs')!;
        const details: Record<PartType, string[]> = {
            head: ['глаза', 'рот', 'волосы', 'уши', 'брови'],
            body: ['плечи', 'живот'],
            arm_l: ['кисть'],
            arm_r: ['кисть'],
            leg_l: ['стопа'],
            leg_r: ['стопа'],
            eye: ['зрачок', 'веко'],
            mouth: ['губы', 'зубы'],
            hair: ['челка', 'хвост'],
            clothes: ['воротник', 'рукава']
        };

        const currentDetails = details[this.activePart] || [];
        container.innerHTML = currentDetails.map((d, i) => 
            `<button class="detail-tab ${i === 0 ? 'active' : ''}" role="tab" aria-selected="${i === 0}" title="Редактировать ${d}">${d}</button>`
        ).join('');

        // Добавляем обработчики для детальных вкладок
        container.querySelectorAll('.detail-tab').forEach(el => {
            const btn = el as HTMLElement;
            btn.addEventListener('click', () => {
                container.querySelectorAll('.detail-tab').forEach(b => {
                    (b as HTMLElement).classList.remove('active');
                    (b as HTMLElement).setAttribute('aria-selected', 'false');
                });
                btn.classList.add('active');
                btn.setAttribute('aria-selected', 'true');
                // Здесь можно добавить подсветку на холсте
                this.highlightPart(btn.textContent || '');
            });
        });
    }

    private highlightPart(detail: string) {
        // Визуальная обратная связь - мигание или подсветка на холсте
        // Пока просто логируем
        console.log(`🎯 Редактируем: ${detail} части ${this.activePart}`);
    }

    // ============ РАБОТА С ПРЕСЕТАМИ ============

    private loadPresets() {
        try {
            const saved = localStorage.getItem('creaturePresets');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.presets = parsed.map((p: any) => ({
                    id: p.id,
                    name: p.name,
                    parts: {}, // ImageData не сохраняем в JSON
                    preview: p.preview || ''
                }));
                this.renderPresets();
                console.log(`📂 Загружено ${this.presets.length} пресетов`);
            } else {
                // Создаем демо-пресеты если их нет
                this.createDemoPresets();
            }
        } catch (e) {
            console.warn('Ошибка загрузки пресетов:', e);
            this.createDemoPresets();
        }
    }

    private createDemoPresets() {
        // Создаем 3 демо-пресета
        const demoPresets: CreaturePreset[] = [
            {
                id: 'demo_1',
                name: 'Веселый',
                parts: {},
                preview: ''
            },
            {
                id: 'demo_2',
                name: 'Грустный',
                parts: {},
                preview: ''
            },
            {
                id: 'demo_3',
                name: 'Удивленный',
                parts: {},
                preview: ''
            }
        ];

        // Рисуем простые пресеты на холсте
        demoPresets.forEach((preset, index) => {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = 60;
            tempCanvas.height = 80;
            const tempCtx = tempCanvas.getContext('2d')!;
            
            // Рисуем простого человечка
            const colors = ['#b8a9c9', '#c9b8a9', '#a9c9b8'];
            tempCtx.fillStyle = colors[index % colors.length];
            
            // Голова
            tempCtx.beginPath();
            tempCtx.arc(30, 20, 12, 0, Math.PI * 2);
            tempCtx.fill();
            
            // Тело
            tempCtx.fillRect(22, 34, 16, 20);
            
            // Глаза
            tempCtx.fillStyle = '#333';
            tempCtx.beginPath();
            tempCtx.arc(26, 18, 2, 0, Math.PI * 2);
            tempCtx.fill();
            tempCtx.beginPath();
            tempCtx.arc(34, 18, 2, 0, Math.PI * 2);
            tempCtx.fill();
            
            // Рот
            tempCtx.strokeStyle = '#333';
            tempCtx.lineWidth = 1.5;
            if (index === 0) {
                // Улыбка
                tempCtx.beginPath();
                tempCtx.arc(30, 24, 5, 0, Math.PI);
                tempCtx.stroke();
            } else if (index === 1) {
                // Грустный
                tempCtx.beginPath();
                tempCtx.arc(30, 28, 5, Math.PI, 0);
                tempCtx.stroke();
            } else {
                // Удивленный
                tempCtx.beginPath();
                tempCtx.arc(30, 24, 3, 0, Math.PI * 2);
                tempCtx.stroke();
            }
            
            preset.preview = tempCanvas.toDataURL();
        });

        this.presets = demoPresets;
        this.saveToStorage();
        this.renderPresets();
        console.log('🎨 Созданы демо-пресеты');
    }

    private savePreset() {
        const name = prompt('Введите имя пресета:');
        if (!name) return;

        // Сохраняем все слои
        const parts: any = {};
        this.layers.forEach((data, key) => {
            parts[key] = data;
        });

        const preset: CreaturePreset = {
            id: `preset_${Date.now()}`,
            name: name,
            parts: parts,
            preview: this.canvas.toDataURL()
        };

        this.presets.push(preset);
        this.saveToStorage();
        this.renderPresets();
        alert(`✅ Пресет "${name}" сохранен!`);
    }

    private renderPresets() {
        const grid = document.getElementById('presetGrid')!;
        grid.innerHTML = '';

        if (this.presets.length === 0) {
            grid.innerHTML = '<div style="grid-column:1/-1;color:#b0a8b8;font-size:12px;text-align:center;padding:20px;">Нет пресетов<br>Создайте свой!</div>';
            return;
        }

        this.presets.forEach((p, index) => {
            const div = document.createElement('div');
            div.className = 'preset-item';
            div.setAttribute('role', 'listitem');
            div.setAttribute('aria-label', `Пресет ${p.name}`);
            
            if (p.preview) {
                const img = document.createElement('img');
                img.src = p.preview;
                img.alt = p.name;
                img.loading = 'lazy';
                div.appendChild(img);
            }
            
            const name = document.createElement('span');
            name.textContent = p.name;
            div.appendChild(name);
            
            div.addEventListener('click', () => this.loadPreset(p));
            grid.appendChild(div);
        });
    }

    private loadPreset(preset: CreaturePreset) {
        if (!preset || !preset.parts) {
            alert('Этот пресет не содержит данных для загрузки');
            return;
        }

        this.clearCanvas();
        this.layers.clear();
        
        let loaded = 0;
        Object.entries(preset.parts).forEach(([key, data]) => {
            if (data) {
                const partKey = key as PartType;
                this.layers.set(partKey, data);
                if (key === this.activePart) {
                    this.currentLayer = data;
                    this.ctx.putImageData(data, 0, 0);
                }
                loaded++;
            }
        });
        
        // Если не загрузился текущий слой, показываем первый доступный
        if (!this.currentLayer && this.layers.size > 0) {
            const first = this.layers.values().next().value;
            if (first) {
                this.currentLayer = first;
                this.ctx.putImageData(first, 0, 0);
            }
        }
        
        this.render();
        alert(`✅ Пресет "${preset.name}" загружен! (загружено ${loaded} частей)`);
    }

    private loadFromStorage() {
        try {
            const saved = localStorage.getItem('creaturePresets');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.presets = parsed.map((p: any) => ({
                    id: p.id,
                    name: p.name,
                    parts: {},
                    preview: p.preview || ''
                }));
                this.renderPresets();
            }
        } catch (e) {
            console.warn('Ошибка загрузки из хранилища:', e);
        }
    }

    private saveToStorage() {
        try {
            const simplified = this.presets.map(p => ({
                id: p.id,
                name: p.name,
                preview: p.preview || ''
            }));
            localStorage.setItem('creaturePresets', JSON.stringify(simplified));
            console.log(`💾 Сохранено ${this.presets.length} пресетов`);
        } catch (e) {
            console.warn('Ошибка сохранения в хранилище:', e);
        }
    }

    private saveCreature() {
        // Сохраняем все слои
        const parts: any = {};
        this.layers.forEach((data, key) => {
            parts[key] = data;
        });

        if (Object.keys(parts).length === 0) {
            alert('⚠️ Сначала создайте персонажа!');
            return;
        }

        const preset: CreaturePreset = {
            id: `creature_${Date.now()}`,
            name: `Существо ${new Date().toLocaleTimeString()}`,
            parts: parts,
            preview: this.canvas.toDataURL()
        };

        // Передаем в игру через событие
        const event = new CustomEvent('creatureCreated', { detail: preset });
        document.dispatchEvent(event);
        
        // Закрываем редактор
        document.getElementById('closeEditorBtn')?.click();
    }

    public init() {
        this.loadFromStorage();
        this.clearCanvas();
        this.render();
        console.log('🔄 Редактор инициализирован');
    }
}