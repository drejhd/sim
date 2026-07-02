import { BodyPartPreset, BodyPartType } from '../types';

export class PresetManager {
    private presets: Map<BodyPartType, BodyPartPreset[]> = new Map();
    
    constructor() {
        this.loadPresets();
    }
    
    // Загрузка пресетов из папки public/presets/
    private async loadPresets() {
        // Пока заглушка - загружаем из localStorage или создаем демо
        try {
            const saved = localStorage.getItem('bodyPresets');
            if (saved) {
                const parsed = JSON.parse(saved);
                // Восстанавливаем из сохраненных данных
                this.presets = new Map(
                    Object.entries(parsed).map(([key, value]) => {
                        return [key as BodyPartType, value as BodyPartPreset[]];
                    })
                );
            } else {
                // Создаем демо-пресеты
                this.createDemoPresets();
            }
        } catch (e) {
            console.warn('Ошибка загрузки пресетов:', e);
            this.createDemoPresets();
        }
    }
    
    private createDemoPresets() {
        // Создаем тестовые пресеты на canvas
        const types: BodyPartType[] = ['head', 'torso', 'shoulder_l', 'shoulder_r', 'forearm_l', 'forearm_r', 'hand_l', 'hand_r', 'thigh_l', 'thigh_r', 'calf_l', 'calf_r', 'foot_l', 'foot_r'];
        
        types.forEach(type => {
            const presets = this.generateDemoPreset(type);
            this.presets.set(type, presets);
        });
        
        this.saveToStorage();
    }
    
    private generateDemoPreset(type: BodyPartType): BodyPartPreset[] {
        // Создаем 3-4 варианта для каждой части
        const results: BodyPartPreset[] = [];
        const colors = ['#b8a9c9', '#c9b8a9', '#a9c9b8', '#c9b8b8'];
        
        for (let i = 0; i < 3; i++) {
            const canvas = document.createElement('canvas');
            canvas.width = 100;
            canvas.height = 120;
            const ctx = canvas.getContext('2d')!;
            
            // Рисуем простую форму в зависимости от типа
            ctx.fillStyle = colors[i % colors.length];
            
            // Простая логика рисования частей
            this.drawBodyPart(ctx, type, i);
            
            results.push({
                id: `${type}_${i}`,
                name: `${type} ${i + 1}`,
                type: type,
                imageData: ctx.getImageData(0, 0, 100, 120),
                preview: canvas.toDataURL()
            });
        }
        
        return results;
    }
    
    private drawBodyPart(ctx: CanvasRenderingContext2D, type: BodyPartType, variant: number) {
        // Временная заглушка - рисуем разные формы
        const w = ctx.canvas.width;
        const h = ctx.canvas.height;
        
        ctx.beginPath();
        if (type === 'head') {
            ctx.arc(w/2, h/2 - 20, 40 + variant * 5, 0, Math.PI * 2);
        } else if (type === 'torso') {
            ctx.roundRect(w/2 - 20 - variant * 3, 10, 40 + variant * 6, 80, 10);
        } else if (type.includes('shoulder')) {
            ctx.roundRect(0, 0, 40, 30, 5);
        } else if (type.includes('forearm')) {
            ctx.roundRect(5, 0, 30, 60, 5);
        } else if (type.includes('hand')) {
            ctx.beginPath();
            ctx.arc(w/2, h/2, 15 + variant * 2, 0, Math.PI * 2);
        } else if (type.includes('thigh')) {
            ctx.roundRect(10, 0, 30, 70, 5);
        } else if (type.includes('calf')) {
            ctx.roundRect(10, 0, 25, 60, 5);
        } else if (type.includes('foot')) {
            ctx.beginPath();
            ctx.ellipse(w/2, h/2, 20 + variant * 2, 10, 0, 0, Math.PI * 2);
        }
        ctx.fill();
    }
    
    public getPresets(type: BodyPartType): BodyPartPreset[] {
        return this.presets.get(type) || [];
    }
    
    public getAllPresets(): Map<BodyPartType, BodyPartPreset[]> {
        return this.presets;
    }
    
    private saveToStorage() {
        try {
            // Сохраняем только preview, не imageData
            const data: any = {};
            this.presets.forEach((presets, key) => {
                data[key] = presets.map(p => ({
                    id: p.id,
                    name: p.name,
                    type: p.type,
                    preview: p.preview
                }));
            });
            localStorage.setItem('bodyPresets', JSON.stringify(data));
        } catch (e) {
            console.warn('Ошибка сохранения пресетов:', e);
        }
    }
}