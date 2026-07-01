import { Creature, CreaturePreset } from '../types';

export class GameField {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private creatures: Creature[] = [];
    private animationId: number | null = null;
    private lastTime = 0;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    private resizeCanvas() {
        const rect = this.canvas.parentElement?.getBoundingClientRect();
        if (rect) {
            this.canvas.width = rect.width;
            this.canvas.height = rect.height - 20;
        }
    }

    public start() {
        this.gameLoop(0);
    }

    private gameLoop(timestamp: number) {
        const delta = timestamp - this.lastTime;
        
        if (delta > 50) { // 20 FPS для экономии ресурсов
            this.update();
            this.render();
            this.lastTime = timestamp;
        }

        this.animationId = requestAnimationFrame((t) => this.gameLoop(t));
    }

    private update() {
        // Пока просто двигаем существ (позже добавим логику)
        this.creatures.forEach(creature => {
            creature.x += (Math.random() - 0.5) * 2;
            creature.y += (Math.random() - 0.5) * 2;
            
            // Ограничиваем в пределах canvas
            creature.x = Math.max(20, Math.min(this.canvas.width - 20, creature.x));
            creature.y = Math.max(20, Math.min(this.canvas.height - 20, creature.y));
        });
    }

    private render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Рисуем всех существ
        this.creatures.forEach(creature => {
            this.drawCreature(creature);
        });

        // Обновляем счетчик
        const countEl = document.getElementById('creatureCount');
        if (countEl) countEl.textContent = `Существ: ${this.creatures.length}`;
    }

    private drawCreature(creature: Creature) {
        // Временно рисуем простые кружочки с именами
        const ctx = this.ctx;
        const x = creature.x;
        const y = creature.y;
        
        // Тело (круг)
        ctx.beginPath();
        ctx.arc(x, y, 30, 0, Math.PI * 2);
        ctx.fillStyle = '#4a9eff';
        ctx.fill();
        ctx.strokeStyle = '#2a6fbf';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Глаза (простые)
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(x - 10, y - 5, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + 10, y - 5, 8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.arc(x - 8, y - 3, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + 12, y - 3, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Рот
        ctx.beginPath();
        ctx.arc(x, y + 10, 8, 0, Math.PI);
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Имя
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(creature.name || 'Существо', x, y + 50);
    }

    public addCreature(preset: CreaturePreset) {
        const creature: Creature = {
            id: `creature_${Date.now()}`,
            name: `Существо ${this.creatures.length + 1}`,
            preset: preset,
            x: Math.random() * (this.canvas.width - 60) + 30,
            y: Math.random() * (this.canvas.height - 60) + 30,
            scale: 1,
            rotation: 0
        };
        
        this.creatures.push(creature);
    }

    public stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
}