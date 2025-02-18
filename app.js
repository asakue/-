document.addEventListener('DOMContentLoaded', () => {
    console.log('Инициализация приложения...');
    try {
        ThemeManager.init();
        GroupManager.init();
        ScheduleManager.init();
        console.log('Приложение успешно инициализировано');
    } catch (error) {
        console.error('Ошибка инициализации:', error);
        UI.showError('Критическая ошибка при запуске приложения');
    }
});

const ThemeManager = {
    STORAGE_KEY: 'dstu_theme',
    
    init() {
        try {
            const savedTheme = localStorage.getItem(this.STORAGE_KEY) || 
                              (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
            this.setTheme(savedTheme);
            document.getElementById('themeToggle').addEventListener('change', (e) => 
                this.setTheme(e.target.checked ? 'dark' : 'light')
            );
            console.log('Тема успешно загружена:', savedTheme);
        } catch (error) {
            console.error('Ошибка инициализации темы:', error);
        }
    },

    setTheme(theme, save = true) {
        document.documentElement.setAttribute('data-theme', theme);
        document.getElementById('themeToggle').checked = theme === 'dark';
        if (save) {
            localStorage.setItem(this.STORAGE_KEY, theme);
            console.log('Тема сохранена:', theme);
        }
    }
};

const GroupManager = {
    groups: [],
    
    async init() {
        try {
            UI.toggleLoading(true);
            this.groups = await this.fetchGroups();
            this.populateSelect();
            this.setupSearch();
            console.log('Группы успешно загружены:', this.groups.length);
        } catch (error) {
            console.error('Ошибка загрузки групп:', error);
            UI.showError('Не удалось загрузить список групп');
        } finally {
            UI.toggleLoading(false);
        }
    },

    async fetchGroups() {
        const response = await fetch('https://edu.donstu.ru/api/raspGrouplist');
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        
        const data = await response.json();
        console.log('Ответ API групп:', data);
        
        if (!data?.data) throw new Error('Неверный формат данных');
        return data.data.filter(g => g.id && g.name);
    },

    populateSelect() {
        const select = document.getElementById('groupSelect');
        select.innerHTML = this.groups
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(g => `<option value="${g.id}">${g.name} (${g.facul})</option>`)
            .join('');
        console.log('Список групп обновлен');
    },

    setupSearch() {
        document.getElementById('searchInput').addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const filtered = this.groups.filter(g => 
                g.name.toLowerCase().includes(term) || 
                g.facul.toLowerCase().includes(term)
            );
            this.groups = filtered;
            this.populateSelect();
            console.log('Поиск выполнен:', term);
        });
    }
};

const ScheduleManager = {
    async loadSchedule() {
        try {
            const groupId = document.getElementById('groupSelect').value;
            const date = document.getElementById('datePicker').value;
            
            if (!groupId || !date) {
                throw new Error('Не выбрана группа или дата');
            }

            UI.toggleLoading(true);
            const lessons = await this.fetchSchedule(groupId, date);
            this.renderSchedule(lessons);
            console.log('Расписание успешно загружено:', lessons);
        } catch (error) {
            console.error('Ошибка загрузки расписания:', error);
            UI.showError(error.message);
        } finally {
            UI.toggleLoading(false);
        }
    },

    async fetchSchedule(groupId, date) {
        const apiUrl = `https://edu.donstu.ru/api/Rasp?idGroup=${groupId}&date=${date}`;
        console.log('Запрос расписания:', apiUrl);
        
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        
        const data = await response.json();
        console.log('Ответ API расписания:', data);
        
        if (data.state !== 1) throw new Error(data.msg || 'Ошибка сервера');
        if (!data.data?.rasp?.length) throw new Error('Нет занятий на выбранную дату');
        
        return data.data.rasp.map(lesson => ({
            time: lesson.time || '—',
            discipline: lesson.discipline || '—',
            auditory: lesson.auditory || '—',
            lecturer: lesson.lecturer || '—',
            weekType: lesson.typeWeek?.shortName || '—'
        }));
    },

    renderSchedule(lessons) {
        const container = document.getElementById('schedule');
        container.innerHTML = lessons.length ? 
            this.generateTable(lessons) : 
            '<div class="info-message">🎉 Свободный день!</div>';
        console.log('Расписание отрисовано');
    },

    generateTable(lessons) {
        return `
            <table class="schedule-table">
                <thead>
                    <tr>
                        ${['Время', 'Дисциплина', 'Аудитория', 'Преподаватель', 'Неделя']
                            .map(h => `<th>${h}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${lessons.map(lesson => `
                        <tr>
                            <td>${lesson.time}</td>
                            <td>${lesson.discipline}</td>
                            <td class="auditory-cell">
                                <span class="auditory">
                                    <i class="fas fa-door-open"></i>
                                    ${lesson.auditory}
                                </span>
                            </td>
                            <td>${lesson.lecturer}</td>
                            <td>${lesson.weekType}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }
};

const UI = {
    showError(message) {
        const errorDiv = document.getElementById('error');
        errorDiv.innerHTML = `⚠️ ${message}`;
        errorDiv.style.display = 'block';
        setTimeout(() => errorDiv.style.display = 'none', 5000);
    },

    toggleLoading(show) {
        document.getElementById('loading').style.display = show ? 'flex' : 'none';
    }
};

// Инициализация обработчиков
document.getElementById('viewScheduleButton').addEventListener('click', () => ScheduleManager.loadSchedule());
document.getElementById('datePicker').value = new Date().toISOString().split('T')[0];

// Для тестирования без API
// ScheduleManager.loadSchedule = async () => {
//     ScheduleManager.renderSchedule([{
//         time: "09:00-10:30",
//         discipline: "Тестовая дисциплина",
//         auditory: "101",
//         lecturer: "Иванов И.И.",
//         weekType: "В"
//     }]);
// };
