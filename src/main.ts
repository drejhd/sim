import { GameField } from './game/GameField';
import { BodyEditor } from './editor/BodyEditor';
import { StageManager } from './editor/StageManager';

const gameMode = document.getElementById('game-mode')!;
const editorMode = document.getElementById('editor-mode')!;
const gameCanvas = document.getElementById('gameCanvas') as HTMLCanvasElement;

const game = new GameField(gameCanvas);

// СОЗДАЕМ НОВЫЕ КОМПОНЕНТЫ ВМЕСТО EditorMode
const bodyEditor = new BodyEditor();
const stageManager = new StageManager((stage, index) => {
    console.log(`📌 Этап ${index + 1}: ${stage}`);
    const event = new CustomEvent('stageChanged', { 
        detail: { stage, index } 
    });
    document.dispatchEvent(event);
});

// Открыть редактор
document.getElementById('createBtn')?.addEventListener('click', () => {
    gameMode.classList.remove('active');
    editorMode.classList.add('active');
    bodyEditor.init(); // Вместо editor.init()
    stageManager.goToStage(0);
});

// Закрыть редактор
document.getElementById('closeEditorBtn')?.addEventListener('click', () => {
    editorMode.classList.remove('active');
    gameMode.classList.add('active');
});

// Создать существо из редактора
document.addEventListener('creatureCreated', ((e: CustomEvent) => {
    game.addCreature(e.detail);
    editorMode.classList.remove('active');
    gameMode.classList.add('active');
}) as EventListener);

game.start();