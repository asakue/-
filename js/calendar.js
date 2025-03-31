// Модуль календаря
let calendarState = {
    currentDate: new Date(),
    selectedDate: new Date(),
    dayTasks: []
};

function initCalendarModule() {
    setupCalendarNavigation();
    setupCalendarEvents();
    renderCalendar();
    updateDayTasks();
    
    // Обработчик для добавления задачи из календаря
    document.getElementById('add-calendar-task').addEventListener('click', function() {
        const dueDateInput = document.getElementById('task-due-date');
        dueDateInput.value = formatDateForInput(calendarState.selectedDate);
        document.getElementById('task-modal-title').textContent = 'Новая задача';
        document.getElementById('task-id').value = '';
        document.getElementById('task-title').value = '';
        document.getElementById('task-description').value = '';
        document.getElementById('task-priority').value = 'medium';
        showModal('task-modal');
    });
}

function setupCalendarNavigation() {
    document.getElementById('prev-month').addEventListener('click', function() {
        calendarState.currentDate.setMonth(calendarState.currentDate.getMonth() - 1);
        renderCalendar();
    });
    
    document.getElementById('next-month').addEventListener('click', function() {
        calendarState.currentDate.setMonth(calendarState.currentDate.getMonth() + 1);
        renderCalendar();
    });
}

function setupCalendarEvents() {
    // Для делегирования события клика на дни календаря
    document.getElementById('calendar-days').addEventListener('click', function(e) {
        const dayElement = e.target.closest('.calendar-day');
        if (dayElement && !dayElement.classList.contains('empty-cell')) {
            const day = parseInt(dayElement.textContent);
            const newDate = new Date(calendarState.currentDate);
            
            // Если это день из другого месяца
            if (dayElement.classList.contains('other-month')) {
                if (parseInt(dayElement.dataset.month) < calendarState.currentDate.getMonth()) {
                    // Предыдущий месяц
                    newDate.setMonth(calendarState.currentDate.getMonth() - 1);
                } else {
                    // Следующий месяц
                    newDate.setMonth(calendarState.currentDate.getMonth() + 1);
                }
            }
            
            newDate.setDate(day);
            calendarState.selectedDate = newDate;
            
            // Обновляем выделение в календаре
            const allDays = document.querySelectorAll('.calendar-day');
            allDays.forEach(day => day.classList.remove('selected'));
            dayElement.classList.add('selected');
            
            // Обновляем список задач для выбранного дня
            updateDayTasks();
        }
    });
}

function renderCalendar() {
    // Обновляем заголовок месяца
    const monthNames = [
        'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ];
    
    const currentMonthName = monthNames[calendarState.currentDate.getMonth()];
    const currentYear = calendarState.currentDate.getFullYear();
    document.getElementById('current-month').textContent = `${currentMonthName} ${currentYear}`;
    
    // Получаем первый день месяца
    const firstDayOfMonth = new Date(
        calendarState.currentDate.getFullYear(),
        calendarState.currentDate.getMonth(),
        1
    );
    
    // Получаем последний день месяца
    const lastDayOfMonth = new Date(
        calendarState.currentDate.getFullYear(),
        calendarState.currentDate.getMonth() + 1,
        0
    );
    
    // Определяем день недели первого дня месяца (0 - воскресенье, 1 - понедельник, и т.д.)
    let firstDayWeekday = firstDayOfMonth.getDay();
    // Преобразуем для нашего представления (0 - понедельник, 6 - воскресенье)
    firstDayWeekday = firstDayWeekday === 0 ? 6 : firstDayWeekday - 1;
    
    const totalDays = lastDayOfMonth.getDate();
    const calendarDaysEl = document.getElementById('calendar-days');
    calendarDaysEl.innerHTML = '';
    
    // Дни из предыдущего месяца
    const prevMonthLastDay = new Date(
        calendarState.currentDate.getFullYear(),
        calendarState.currentDate.getMonth(),
        0
    ).getDate();
    
    for (let i = 0; i < firstDayWeekday; i++) {
        const dayNum = prevMonthLastDay - firstDayWeekday + i + 1;
        const dayEl = createDayElement(dayNum, true);
        dayEl.dataset.month = calendarState.currentDate.getMonth() - 1;
        calendarDaysEl.appendChild(dayEl);
    }
    
    // Дни текущего месяца
    const today = new Date();
    const isCurrentMonthYear = 
        today.getMonth() === calendarState.currentDate.getMonth() && 
        today.getFullYear() === calendarState.currentDate.getFullYear();
    
    for (let i = 1; i <= totalDays; i++) {
        const dayEl = createDayElement(i, false);
        
        // Отмечаем сегодняшний день
        if (isCurrentMonthYear && i === today.getDate()) {
            dayEl.classList.add('today');
        }
        
        // Отмечаем выбранный день
        if (isSameDay(calendarState.selectedDate, new Date(
            calendarState.currentDate.getFullYear(),
            calendarState.currentDate.getMonth(),
            i
        ))) {
            dayEl.classList.add('selected');
        }
        
        // Проверяем наличие задач на этот день
        const dateToCheck = new Date(
            calendarState.currentDate.getFullYear(),
            calendarState.currentDate.getMonth(),
            i
        );
        
        const hasTasks = checkTasksForDate(dateToCheck);
        if (hasTasks) {
            dayEl.classList.add('has-tasks');
        }
        
        calendarDaysEl.appendChild(dayEl);
    }
    
    // Добавляем дни из следующего месяца для заполнения сетки
    const totalCells = 42; // 6 рядов по 7 дней
    const remainingCells = totalCells - (firstDayWeekday + totalDays);
    
    for (let i = 1; i <= remainingCells; i++) {
        const dayEl = createDayElement(i, true);
        dayEl.dataset.month = calendarState.currentDate.getMonth() + 1;
        calendarDaysEl.appendChild(dayEl);
    }
}

function createDayElement(day, isOtherMonth) {
    const dayEl = document.createElement('div');
    dayEl.classList.add('calendar-day');
    dayEl.textContent = day;
    
    if (isOtherMonth) {
        dayEl.classList.add('other-month');
    }
    
    return dayEl;
}

function checkTasksForDate(date) {
    const tasks = getFromStorage('tasks', []);
    return tasks.some(task => {
        if (!task.dueDate) return false;
        const taskDate = new Date(task.dueDate);
        return isSameDay(taskDate, date);
    });
}

function updateDayTasks() {
    // Обновляем заголовок с выбранной датой
    document.getElementById('selected-date').textContent = formatDate(calendarState.selectedDate);
    
    // Получаем задачи для выбранного дня
    const allTasks = getFromStorage('tasks', []);
    
    calendarState.dayTasks = allTasks.filter(task => {
        if (!task.dueDate) return false;
        const taskDate = new Date(task.dueDate);
        return isSameDay(taskDate, calendarState.selectedDate);
    });
    
    renderDayTasks();
}

function renderDayTasks() {
    const dayTasksEl = document.getElementById('day-tasks');
    dayTasksEl.innerHTML = '';
    
    if (calendarState.dayTasks.length === 0) {
        const emptyEl = document.createElement('div');
        emptyEl.classList.add('empty-day-tasks');
        emptyEl.innerHTML = `
            <i class="far fa-calendar-check"></i>
            <div>Нет задач на этот день</div>
        `;
        dayTasksEl.appendChild(emptyEl);
        return;
    }
    
    calendarState.dayTasks.forEach(task => {
        dayTasksEl.appendChild(createDayTaskElement(task));
    });
}

function createDayTaskElement(task) {
    const taskEl = document.createElement('div');
    taskEl.classList.add('day-task-item');
    taskEl.classList.add(`priority-${task.priority}`);
    
    if (task.completed) {
        taskEl.classList.add('completed');
    }
    
    taskEl.innerHTML = `
        <div class="day-task-title">${task.title}</div>
        <div class="day-task-time">
            <i class="far fa-clock"></i>
            <span>Весь день</span>
        </div>
    `;
    
    taskEl.addEventListener('click', function() {
        editTask(task.id);
    });
    
    return taskEl;
}

function isSameDay(date1, date2) {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
}

function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}