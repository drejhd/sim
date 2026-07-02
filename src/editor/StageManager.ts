export type Stage = 'body' | 'skin' | 'details' | 'clothes';

export class StageManager {
    private currentStageIndex = 0;
    private stages: Stage[] = ['body', 'skin', 'details', 'clothes'];
    private stageNames: Record<Stage, string> = {
        body: 'Форма тела',
        skin: 'Рисунок на коже',
        details: 'Детали',
        clothes: 'Одежда'
    };
    private onStageChange: (stage: Stage, index: number) => void;

    constructor(onStageChange: (stage: Stage, index: number) => void) {
        this.onStageChange = onStageChange;
        this.setupUI();
        // Не вызываем goToStage сразу, ждем инициализации извне
    }

    private setupUI() {
        // Кнопки этапов (в индикаторе)
        document.querySelectorAll('.stage').forEach(el => {
            const btn = el as HTMLElement;
            btn.addEventListener('click', () => {
                const index = parseInt(btn.dataset.stage || '0');
                this.goToStage(index);
            });
        });

        // Кнопки навигации
        const prevBtn = document.getElementById('prevStageBtn');
        const nextBtn = document.getElementById('nextStageBtn');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                this.goToStage(this.currentStageIndex - 1);
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.goToStage(this.currentStageIndex + 1);
            });
        }
    }

    public goToStage(index: number) {
        if (index < 0 || index >= this.stages.length) return;

        this.currentStageIndex = index;
        const stage = this.stages[index];

        // 1. Обновляем индикатор этапов (сверху)
        document.querySelectorAll('.stage').forEach((el, i) => {
            const btn = el as HTMLElement;
            btn.classList.remove('active', 'done');
            if (i === index) {
                btn.classList.add('active');
            } else if (i < index) {
                btn.classList.add('done');
            }
        });

        // 2. Обновляем кнопки навигации
        const prevBtn = document.getElementById('prevStageBtn') as HTMLButtonElement;
        const nextBtn = document.getElementById('nextStageBtn') as HTMLButtonElement;
        const counter = document.getElementById('stageCounter');

        if (prevBtn) prevBtn.disabled = index === 0;
        if (nextBtn) nextBtn.disabled = index === this.stages.length - 1;
        if (counter) counter.textContent = `${index + 1} / ${this.stages.length}`;

        // 3. Показываем/скрываем контент правой панели
        document.querySelectorAll('.stage-content').forEach((el) => {
            const content = el as HTMLElement;
            const stageAttr = content.dataset.stage;
            if (stageAttr === stage) {
                content.style.display = 'flex';
                content.classList.add('active');
            } else {
                content.style.display = 'none';
                content.classList.remove('active');
            }
        });

        // 4. Показываем/скрываем левую панель с частями тела (только для этапа "Тело")
        const editorLeft = document.querySelector('.editor-left') as HTMLElement;
        if (editorLeft) {
            editorLeft.style.display = stage === 'body' ? 'flex' : 'none';
        }

        // 5. Показываем/скрываем мини-холст (только для этапов "Тело" и "Кожа")
        const miniCanvasWrapper = document.querySelector('.mini-canvas-wrapper') as HTMLElement;
        if (miniCanvasWrapper) {
            const showMini = stage === 'body' || stage === 'skin';
            miniCanvasWrapper.style.display = showMini ? 'block' : 'none';
        }

        // 6. Вызываем колбэк
        this.onStageChange(stage, index);
    }

    public getCurrentStage(): Stage {
        return this.stages[this.currentStageIndex];
    }

    public getCurrentIndex(): number {
        return this.currentStageIndex;
    }
}