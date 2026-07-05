import { BodyPartType } from '../types';

export interface PartConfig {
    anchor: { x: number, y: number };  // где крепится (относительно спрайта)
    defaultSize: { width: number, height: number }; // размер в игровых единицах
    attachTo: BodyPartType | null;     // к какой части крепится
    attachOffset: { x: number, y: number }; // смещение от точки крепления
}

export const PART_CONFIGS: Record<BodyPartType, PartConfig> = {
    // ГОЛОВА — центральная часть
    head: {
        anchor: { x: 0.5, y: 0.5 },     // центр спрайта
        defaultSize: { width: 80, height: 80 },
        attachTo: null,
        attachOffset: { x: 0, y: 0 }
    },
    
    // УШИ — крепятся к голове
    ear_l: {
        anchor: { x: 0.9, y: 0.3 },     // правая сторона спрайта (ухо смотрит влево)
        defaultSize: { width: 30, height: 40 },
        attachTo: 'head',
        attachOffset: { x: -35, y: -5 } // слева от центра головы
    },
    ear_r: {
        anchor: { x: 0.1, y: 0.3 },     // левая сторона спрайта (ухо смотрит вправо)
        defaultSize: { width: 30, height: 40 },
        attachTo: 'head',
        attachOffset: { x: 35, y: -5 }  // справа от центра головы
    },
    
    // ТУЛОВИЩЕ
    torso: {
        anchor: { x: 0.5, y: 0.3 },
        defaultSize: { width: 70, height: 90 },
        attachTo: 'head',
        attachOffset: { x: 0, y: 45 }   // под головой
    },
    
    // РУКИ — крепятся к туловищу
    shoulder_l: {
        anchor: { x: 0.9, y: 0.5 },
        defaultSize: { width: 25, height: 35 },
        attachTo: 'torso',
        attachOffset: { x: -38, y: -10 }
    },
    shoulder_r: {
        anchor: { x: 0.1, y: 0.5 },
        defaultSize: { width: 25, height: 35 },
        attachTo: 'torso',
        attachOffset: { x: 38, y: -10 }
    },
    forearm_l: {
        anchor: { x: 0.5, y: 0.0 },
        defaultSize: { width: 20, height: 40 },
        attachTo: 'shoulder_l',
        attachOffset: { x: 0, y: 20 }
    },
    forearm_r: {
        anchor: { x: 0.5, y: 0.0 },
        defaultSize: { width: 20, height: 40 },
        attachTo: 'shoulder_r',
        attachOffset: { x: 0, y: 20 }
    },
    hand_l: {
        anchor: { x: 0.5, y: 0.0 },
        defaultSize: { width: 20, height: 20 },
        attachTo: 'forearm_l',
        attachOffset: { x: 0, y: 22 }
    },
    hand_r: {
        anchor: { x: 0.5, y: 0.0 },
        defaultSize: { width: 20, height: 20 },
        attachTo: 'forearm_r',
        attachOffset: { x: 0, y: 22 }
    },
    
    // НОГИ — крепятся к туловищу
    thigh_l: {
        anchor: { x: 0.5, y: 0.0 },
        defaultSize: { width: 25, height: 40 },
        attachTo: 'torso',
        attachOffset: { x: -15, y: 50 }
    },
    thigh_r: {
        anchor: { x: 0.5, y: 0.0 },
        defaultSize: { width: 25, height: 40 },
        attachTo: 'torso',
        attachOffset: { x: 15, y: 50 }
    },
    calf_l: {
        anchor: { x: 0.5, y: 0.0 },
        defaultSize: { width: 22, height: 40 },
        attachTo: 'thigh_l',
        attachOffset: { x: 0, y: 22 }
    },
    calf_r: {
        anchor: { x: 0.5, y: 0.0 },
        defaultSize: { width: 22, height: 40 },
        attachTo: 'thigh_r',
        attachOffset: { x: 0, y: 22 }
    },
    foot_l: {
        anchor: { x: 0.5, y: 0.0 },
        defaultSize: { width: 25, height: 15 },
        attachTo: 'calf_l',
        attachOffset: { x: 0, y: 22 }
    },
    foot_r: {
        anchor: { x: 0.5, y: 0.0 },
        defaultSize: { width: 25, height: 15 },
        attachTo: 'calf_r',
        attachOffset: { x: 0, y: 22 }
    }
};