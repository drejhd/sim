// Типы для редактора
export interface BodyPart {
    id: string;
    name: string;
    layer: number; // порядок отрисовки
    data: ImageData | null; // пиксельные данные
}

export type BodyPartType = 
    'head' | 'torso' | 
    'shoulder_l' | 'shoulder_r' | 'forearm_l' | 'forearm_r' | 'hand_l' | 'hand_r' |
    'thigh_l' | 'thigh_r' | 'calf_l' | 'calf_r' | 'foot_l' | 'foot_r' |
    'ear_l' | 'ear_r';
    
export interface BodyPartPreset {
    id: string;
    name: string;
    type: BodyPartType;
    imageData: ImageData; // или base64 строка
    preview: string; // dataURL для отображения
    position?: { x: number; y: number }; // смещение относительно центра
    scale?: number; // масштаб
}

export interface CreatureBody {
    parts: Map<BodyPartType, BodyPartPreset>;
    skinLayer: ImageData | null; // для рисования на коже
    selectedPart: BodyPartType | null;
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