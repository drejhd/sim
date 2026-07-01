import { GameField } from './game/GameField';
import { EditorMode } from './editor/EditorMode';

const gameMode = document.getElementById('game-mode')!;
const editorMode = document.getElementById('editor-mode')!;
const gameCanvas = document.getElementById('gameCanvas') as HTMLCanvasElement;

const game = new GameField(gameCanvas);
const editor = new EditorMode();

// Открыть редактор
document.getElementById('createBtn')?.addEventListener('click', () => {
    gameMode.classList.remove('active');
    editorMode.classList.add('active');
    editor.init();
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