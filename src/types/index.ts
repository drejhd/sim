// Типы для редактора
export interface BodyPart {
    id: string;
    name: string;
    layer: number; // порядок отрисовки
    data: ImageData | null; // пиксельные данные
}

export interface CreaturePreset {
    id: string;
    name: string;
    parts: {
        body?: ImageData;
        head?: ImageData;
        arm_l?: ImageData;
        arm_r?: ImageData;
        leg_l?: ImageData;
        leg_r?: ImageData;
        eye?: ImageData;
        mouth?: ImageData;
        hair?: ImageData;
        clothes?: ImageData;
    };
    preview?: string; // dataURL для отображения
}

export interface Creature {
    id: string;
    name: string;
    preset: CreaturePreset;
    x: number;
    y: number;
    scale: number;
    rotation: number;
}

// Инструменты редактора
export type Tool = 'select' | 'pencil' | 'eraser' | 'move';
export type PartType = 'body' | 'head' | 'arm_l' | 'arm_r' | 'leg_l' | 'leg_r' | 'eye' | 'mouth' | 'hair' | 'clothes';

// Состояние редактора
export interface EditorState {
    activeTool: Tool;
    activePart: PartType;
    color: string;
    brushSize: number;
    currentLayer: ImageData | null;
    history: ImageData[];
    historyIndex: number;
}