/**
 * Модуль для работы с задачами
 */

// Ключ для хранения задач в localStorage
const TASKS_STORAGE_KEY = 'tasks';

// Инициализация модуля задач
function initTasksModule() {
    loadTasks();
    setupTaskListeners();
}

// Загружает задачи из localStorage и отображает их
function loadTasks() {
    const tasks = getFromStorage(TASKS_STORAGE_KEY);
    renderTasks(tasks);
}

// Настраивает обработчики событий для функционала задач
function setupTaskListeners() {
    // Кнопка добавления новой задачи
    document.getElementById('add-task-button').addEventListener('click', () => {
        document.getElementById('task-modal-title').textContent = 'Новая задача';
        document.getElementById('task-id').value = '';
        resetForm('task-form');
        
        // Устанавливаем сегодняшнюю дату по умолчанию
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('task-due-date').value = today;
        
        showModal('task-modal');
    });
    
    // Обработка формы задачи
    document.getElementById('task-form').addEventListener('submit', (e) => {
        e.preventDefault();
        saveTask();
    });
    
    // Кнопка отмены в форме
    document.getElementById('cancel-task').addEventListener('click', () => {
        hideModal('task-modal');
    });
    
    // Закрытие модального окна
    document.querySelectorAll('#task-modal .close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            hideModal('task-modal');
        });
    });
    
    // Фильтрация и сортировка задач
    document.getElementById('filter-tasks').addEventListener('change', updateTasksView);
    document.getElementById('sort-tasks').addEventListener('change', updateTasksView);
}

// Отображает список задач
function renderTasks(tasks, searchTerm = '') {
    const tasksContainer = document.getElementById('tasks-list');
    tasksContainer.innerHTML = '';
    
    // Получаем текущие значения фильтра и сортировки
    const filterValue = document.getElementById('filter-tasks').value;
    const sortValue = document.getElementById('sort-tasks').value;
    
    // Применяем фильтрацию и сортировку
    const filteredTasks = filterAndSort(tasks, filterValue, sortValue, searchTerm);
    
    // Проверяем, есть ли задачи для отображения
    if (checkEmptyState(filteredTasks, 'tasks-list', 'У вас пока нет задач. Нажмите "Новая задача", чтобы создать первую задачу.', 'fa-tasks')) {
        return;
    }
    
    // Создаем элементы для каждой задачи
    filteredTasks.forEach(task => {
        const taskElement = createTaskElement(task);
        tasksContainer.appendChild(taskElement);
    });
}

// Создает DOM-элемент для задачи
function createTaskElement(task) {
    const taskElement = document.createElement('div');
    taskElement.className = `task-item priority-${task.priority} ${task.completed ? 'completed' : ''}`;
    taskElement.dataset.id = task.id;
    
    // Определяем текст для приоритета
    const priorityText = {
        'low': 'Низкий',
        'medium': 'Средний',
        'high': 'Высокий'
    };
    
    taskElement.innerHTML = `
        <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
        <div class="task-content">
            <div class="task-title">${task.title}</div>
            ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
            <div class="task-meta">
                ${task.dueDate ? `
                <div class="task-due-date">
                    <i class="fas fa-calendar-alt"></i> ${formatDate(task.dueDate)}
                </div>` : ''}
                <div class="task-priority">
                    <i class="fas fa-flag"></i> 
                    <span class="priority-badge ${task.priority}">${priorityText[task.priority]}</span>
                </div>
                <div class="task-created">
                    <i class="fas fa-clock"></i> ${timeAgo(task.timestamp)}
                </div>
            </div>
        </div>
        <div class="task-actions">
            <button class="task-action-button edit" title="Редактировать">
                <i class="fas fa-edit"></i>
            </button>
            <button class="task-action-button delete" title="Удалить">
                <i class="fas fa-trash-alt"></i>
            </button>
        </div>
    `;
    
    // Обработчик для чекбокса
    const checkbox = taskElement.querySelector('.task-checkbox');
    checkbox.addEventListener('change', () => {
        toggleTaskCompletion(task.id, checkbox.checked);
    });
    
    // Обработчик для кнопки редактирования
    const editButton = taskElement.querySelector('.edit');
    editButton.addEventListener('click', () => {
        editTask(task.id);
    });
    
    // Обработчик для кнопки удаления
    const deleteButton = taskElement.querySelector('.delete');
    deleteButton.addEventListener('click', () => {
        confirmDeleteTask(task.id);
    });
    
    return taskElement;
}

// Сохраняет новую или обновляет существующую задачу
function saveTask() {
    // Получаем данные из формы
    const taskId = document.getElementById('task-id').value;
    const title = document.getElementById('task-title').value.trim();
    const description = document.getElementById('task-description').value.trim();
    const priority = document.getElementById('task-priority').value;
    const dueDate = document.getElementById('task-due-date').value;
    
    // Проверяем, что заголовок не пустой
    if (!title) {
        alert('Пожалуйста, введите название задачи');
        return;
    }
    
    // Получаем текущие задачи
    const tasks = getFromStorage(TASKS_STORAGE_KEY);
    
    // Определяем, это новая задача или редактирование существующей
    if (taskId) {
        // Обновляем существующую задачу
        const updatedTasks = updateItemById(tasks, taskId, {
            title,
            description,
            priority,
            dueDate,
            lastModified: Date.now()
        });
        
        // Сохраняем в localStorage
        if (saveToStorage(TASKS_STORAGE_KEY, updatedTasks)) {
            renderTasks(updatedTasks);
            hideModal('task-modal');
        }
    } else {
        // Создаем новую задачу
        const newTask = {
            id: generateId(),
            title,
            description,
            priority,
            dueDate,
            completed: false,
            timestamp: Date.now(),
            lastModified: Date.now()
        };
        
        // Добавляем в массив и сохраняем
        const updatedTasks = [newTask, ...tasks];
        if (saveToStorage(TASKS_STORAGE_KEY, updatedTasks)) {
            renderTasks(updatedTasks);
            hideModal('task-modal');
        }
    }
}

// Переключает статус выполнения задачи
function toggleTaskCompletion(taskId, completed) {
    const tasks = getFromStorage(TASKS_STORAGE_KEY);
    const updatedTasks = updateItemById(tasks, taskId, {
        completed,
        lastModified: Date.now()
    });
    
    if (saveToStorage(TASKS_STORAGE_KEY, updatedTasks)) {
        // Обновляем класс элемента задачи без полной перерисовки списка
        const taskElement = document.querySelector(`.task-item[data-id="${taskId}"]`);
        if (taskElement) {
            if (completed) {
                taskElement.classList.add('completed');
            } else {
                taskElement.classList.remove('completed');
            }
        }
    }
}

// Открывает форму редактирования задачи
function editTask(taskId) {
    const tasks = getFromStorage(TASKS_STORAGE_KEY);
    const task = findItemById(tasks, taskId);
    
    if (!task) {
        alert('Задача не найдена');
        return;
    }
    
    // Заполняем форму данными задачи
    document.getElementById('task-modal-title').textContent = 'Редактирование задачи';
    document.getElementById('task-id').value = task.id;
    document.getElementById('task-title').value = task.title || '';
    document.getElementById('task-description').value = task.description || '';
    document.getElementById('task-priority').value = task.priority || 'medium';
    document.getElementById('task-due-date').value = task.dueDate || '';
    
    showModal('task-modal');
}

// Показывает подтверждение удаления задачи
function confirmDeleteTask(taskId) {
    const tasks = getFromStorage(TASKS_STORAGE_KEY);
    const task = findItemById(tasks, taskId);
    
    if (!task) {
        alert('Задача не найдена');
        return;
    }
    
    // Настраиваем модальное окно подтверждения
    document.getElementById('confirm-delete-message').textContent = 
        `Вы уверены, что хотите удалить задачу "${task.title}"?`;
    
    // Настраиваем обработчик для кнопки подтверждения
    const confirmButton = document.getElementById('confirm-delete');
    
    // Удаляем предыдущие обработчики, если они были
    const newConfirmButton = confirmButton.cloneNode(true);
    confirmButton.parentNode.replaceChild(newConfirmButton, confirmButton);
    
    // Добавляем новый обработчик
    newConfirmButton.addEventListener('click', () => {
        deleteTask(taskId);
        hideModal('confirm-delete-modal');
    });
    
    // Кнопка отмены
    document.getElementById('cancel-delete').addEventListener('click', () => {
        hideModal('confirm-delete-modal');
    });
    
    showModal('confirm-delete-modal');
}

// Удаляет задачу
function deleteTask(taskId) {
    const tasks = getFromStorage(TASKS_STORAGE_KEY);
    const updatedTasks = removeItemById(tasks, taskId);
    
    if (saveToStorage(TASKS_STORAGE_KEY, updatedTasks)) {
        renderTasks(updatedTasks);
    }
}

// Обновляет представление задач на основе текущих фильтров и поиска
function updateTasksView() {
    const tasks = getFromStorage(TASKS_STORAGE_KEY);
    const searchTerm = document.getElementById('search-input').value;
    renderTasks(tasks, searchTerm);
    
    // Обновляем календарь, если он уже инициализирован
    if (typeof renderCalendar === 'function' && document.getElementById('calendar-days')) {
        renderCalendar();
        // Обновляем список задач для выбранного дня, если мы находимся в секции календаря
        if (typeof updateDayTasks === 'function' && document.querySelector('.tab-button[data-tab="calendar"].active')) {
            updateDayTasks();
        }
    }
}
