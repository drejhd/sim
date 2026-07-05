import { BodyPartPreset, BodyPartType } from '../types';

export class PresetManager {
    private presets: Map<BodyPartType, BodyPartPreset[]> = new Map();
    private isLoaded = false;
    private loadingPromise: Promise<void> | null = null;

    constructor() {
        // Не загружаем сразу в конструкторе, ждем первого запроса
        console.log('📦 PresetManager создан, ожидает загрузки...');
    }

    /**
     * Основной метод загрузки пресетов
     */
    private async ensureLoaded(): Promise<void> {
        if (this.isLoaded) return;
        
        // Если уже идет загрузка — ждем ее
        if (this.loadingPromise) {
            await this.loadingPromise;
            return;
        }
        
        // Запускаем загрузку
        this.loadingPromise = this.loadPresetsFromFiles();
        await this.loadingPromise;
        this.isLoaded = true;
        this.loadingPromise = null;
    }

    /**
     * Загрузка пресетов из PNG-файлов
     */
    private async loadPresetsFromFiles() {
        try {
            console.log('🔄 Загрузка PNG-пресетов...');
            
            // Очищаем существующие пресеты
            this.presets.clear();
            
            const partTypes: { folder: string, type: BodyPartType }[] = [
                { folder: 'head', type: 'head' },
                { folder: 'torso', type: 'torso' },
                { folder: 'shoulders', type: 'shoulder_l' },
                { folder: 'forearms', type: 'forearm_l' },
                { folder: 'hands', type: 'hand_l' },
                { folder: 'thighs', type: 'thigh_l' },
                { folder: 'calves', type: 'calf_l' },
                { folder: 'feet', type: 'foot_l' },
                { folder: 'ears', type: 'ear_l' }
            ];

            // Отслеживаем уже загруженные файлы по имени
            const loadedFiles = new Set<string>();

            for (const { folder, type } of partTypes) {
                const presets = await this.loadPresetsForType(folder, type, loadedFiles);
                
                if (presets.length === 0) {
                    console.log(`📁 Папка ${folder} пуста, пресетов нет`);
                    this.presets.set(type, []);
                    continue;
                }
                
                console.log(`📂 Загружено ${presets.length} пресетов для ${type}`);
                this.presets.set(type, presets);
                
                // Если это парная часть (L) — создаем зеркальную версию (R)
                if (this.isPairedPart(type)) {
                    const rightType = this.getPairedType(type);
                    
                    // Проверяем, не загружены ли уже правые версии отдельно
                    const existingRight = this.presets.get(rightType);
                    if (existingRight && existingRight.length > 0) {
                        console.log(`⚠️ Правые версии для ${rightType} уже загружены, пропускаем зеркалирование`);
                        continue;
                    }
                    
                    const mirroredPresets = presets.map(p => {
                        // Проверяем, не создавали ли мы уже такой пресет
                        const mirrorId = p.id.replace('_l', '_r');
                        if (loadedFiles.has(mirrorId)) {
                            return null;
                        }
                        loadedFiles.add(mirrorId);
                        
                        return {
                            ...p,
                            id: mirrorId,
                            type: rightType,
                            imageData: this.mirrorImageData(p.imageData),
                            preview: this.mirrorPreview(p.preview),
                            meta: {
                                ...p.meta,
                                anchor: { 
                                    x: 1 - p.meta.anchor.x, 
                                    y: p.meta.anchor.y 
                                }
                            }
                        };
                    }).filter((p): p is BodyPartPreset => p !== null);
                    
                    if (mirroredPresets.length > 0) {
                        console.log(`🔄 Создано ${mirroredPresets.length} зеркальных пресетов для ${rightType}`);
                        this.presets.set(rightType, mirroredPresets);
                    }
                }
            }
            
            // Выводим статистику
            let total = 0;
            this.presets.forEach((presets) => {
                total += presets.length;
            });
            console.log(`✅ Загружено ${total} пресетов из PNG-файлов (${this.presets.size} типов)`);
            
        } catch (e) {
            console.warn('❌ Ошибка загрузки PNG-файлов:', e);
            this.createEmptyPresets();
        }
    }

    private isPairedPart(type: BodyPartType): boolean {
        return type === 'shoulder_l' || type === 'forearm_l' || 
            type === 'hand_l' || type === 'thigh_l' || 
            type === 'calf_l' || type === 'foot_l' || 
            type === 'ear_l';
    }

    private getPairedType(type: BodyPartType): BodyPartType {
        return type.replace('_l', '_r') as BodyPartType;
    }

    private createEmptyPresets() {
        const types: BodyPartType[] = [
            'head', 'torso', 
            'shoulder_l', 'shoulder_r', 'forearm_l', 'forearm_r', 
            'hand_l', 'hand_r', 'thigh_l', 'thigh_r', 
            'calf_l', 'calf_r', 'foot_l', 'foot_r',
            'ear_l', 'ear_r'
        ];
        
        types.forEach(type => {
            this.presets.set(type, []);
        });
        
        console.log('📭 Созданы пустые пресеты (нет PNG-файлов)');
    }

    private async loadPresetsForType(
        folder: string, 
        type: BodyPartType, 
        loadedFiles: Set<string>
    ): Promise<BodyPartPreset[]> {
        const presets: BodyPartPreset[] = [];
        const files = await this.getFileListForFolder(folder);
        
        // Базовая конфигурация для meta
        const defaultMeta = {
            anchor: { x: 0.5, y: 0.5 },
            scale: 1
        };
        
        for (const fileName of files) {
            if (!fileName.endsWith('.png')) continue;
            
            // Проверяем, не загружали ли уже этот файл
            const fileKey = `${folder}/${fileName}`;
            if (loadedFiles.has(fileKey)) {
                console.log(`⏭️ Пропускаем дубликат: ${fileKey}`);
                continue;
            }
            loadedFiles.add(fileKey);
            
            // Проверяем, не является ли это правой версией (уже будет создана зеркалированием)
            if (fileName.includes('_r') || fileName.includes('_right')) {
                console.log(`⏭️ Пропускаем правую версию (будет создана зеркалированием): ${fileName}`);
                continue;
            }
            
            try {
                const imageData = await this.loadPNG(`/presets/body_parts/${folder}/${fileName}`);
                const name = fileName.replace('.png', '').replace(/_/g, ' ');
                
                presets.push({
                    id: `${type}_${fileName.replace('.png', '')}`,
                    name: name,
                    type: type,
                    imageData: imageData,
                    preview: this.imageDataToDataURL(imageData),
                    meta: {
                        ...defaultMeta,
                        size: this.getDefaultSizeForType(type)
                    }
                });
            } catch (e) {
                console.warn(`⚠️ Не удалось загрузить ${fileName}:`, e);
            }
        }
        
        return presets;
    }

    private getDefaultSizeForType(type: BodyPartType): { width: number, height: number } {
        const sizes: Record<BodyPartType, { width: number, height: number }> = {
            head: { width: 60, height: 60 },
            torso: { width: 50, height: 70 },
            shoulder_l: { width: 20, height: 30 },
            shoulder_r: { width: 20, height: 30 },
            forearm_l: { width: 18, height: 35 },
            forearm_r: { width: 18, height: 35 },
            hand_l: { width: 18, height: 18 },
            hand_r: { width: 18, height: 18 },
            thigh_l: { width: 20, height: 35 },
            thigh_r: { width: 20, height: 35 },
            calf_l: { width: 18, height: 35 },
            calf_r: { width: 18, height: 35 },
            foot_l: { width: 22, height: 12 },
            foot_r: { width: 22, height: 12 },
            ear_l: { width: 15, height: 25 },
            ear_r: { width: 15, height: 25 }
        };
        return sizes[type] || { width: 30, height: 30 };
    }
    
    private async getFileListForFolder(folder: string): Promise<string[]> {
        // Простой способ: используем import.meta.glob
        try {
            // Для Vite
            const modules = import.meta.glob('/public/presets/body_parts/**/*.png', { eager: true });
            
            const files: string[] = [];
            const basePath = `/presets/body_parts/${folder}/`;
            
            for (const path in modules) {
                // Проверяем, что путь содержит нужную папку
                if (path.includes(`/body_parts/${folder}/`)) {
                    const fileName = path.split('/').pop()!;
                    // Убираем возможные дубликаты
                    if (!files.includes(fileName)) {
                        files.push(fileName);
                    }
                }
            }
            
            // Сортируем для стабильности
            files.sort();
            console.log(`📁 Найдено ${files.length} файлов в ${folder}`);
            return files;
            
        } catch (e) {
            console.warn(`⚠️ Ошибка чтения папки ${folder}, используем fallback:`, e);
            return this.getFallbackFiles(folder);
        }
    }

    private getFallbackFiles(folder: string): string[] {
        const fallbackFiles: Record<string, string[]> = {
            head: ['head_01.png', 'head_02.png', 'head_03.png'],
            torso: ['torso_01.png', 'torso_02.png', 'torso_03.png'],
            ears: ['ear_01.png', 'ear_02.png'],
            shoulders: ['shoulder_01.png', 'shoulder_02.png'],
            forearms: ['forearm_01.png', 'forearm_02.png'],
            hands: ['hand_01.png', 'hand_02.png'],
            thighs: ['thigh_01.png', 'thigh_02.png'],
            calves: ['calf_01.png', 'calf_02.png'],
            feet: ['foot_01.png', 'foot_02.png']
        };
        return fallbackFiles[folder] || [`${folder}_01.png`];
    }

    private async loadPNG(path: string): Promise<ImageData> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d')!;
                ctx.drawImage(img, 0, 0);
                resolve(ctx.getImageData(0, 0, canvas.width, canvas.height));
            };
            img.onerror = () => reject(new Error(`Failed to load ${path}`));
            img.src = path;
        });
    }

    private mirrorImageData(imageData: ImageData): ImageData {
        const canvas = document.createElement('canvas');
        canvas.width = imageData.width;
        canvas.height = imageData.height;
        const ctx = canvas.getContext('2d')!;
        
        // Временный canvas для исходного изображения
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = imageData.width;
        tempCanvas.height = imageData.height;
        const tempCtx = tempCanvas.getContext('2d')!;
        tempCtx.putImageData(imageData, 0, 0);
        
        // Отзеркаливаем
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(tempCanvas, 0, 0);
        
        return ctx.getImageData(0, 0, canvas.width, canvas.height);
    }
    
    private mirrorPreview(preview: string): string {
        const img = new Image();
        img.src = preview;
        
        const canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 120;
        const ctx = canvas.getContext('2d')!;
        
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(img, 0, 0, 100, 120);
        
        return canvas.toDataURL();
    }

    private imageDataToDataURL(imageData: ImageData): string {
        const canvas = document.createElement('canvas');
        canvas.width = imageData.width;
        canvas.height = imageData.height;
        const ctx = canvas.getContext('2d')!;
        ctx.putImageData(imageData, 0, 0);
        return canvas.toDataURL();
    }

    public async getPresets(type: BodyPartType): Promise<BodyPartPreset[]> {
        await this.ensureLoaded();
        return this.presets.get(type) || [];
    }

    public async getAllPresets(): Promise<Map<BodyPartType, BodyPartPreset[]>> {
        await this.ensureLoaded();
        return this.presets;
    }

    public async reloadPresets() {
        localStorage.removeItem('bodyPresets_v2');
        this.presets.clear();
        this.isLoaded = false;
        this.loadingPromise = null;
        await this.loadPresetsFromFiles();
        this.isLoaded = true;
    }
}