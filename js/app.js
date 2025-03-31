/**
 * Основной модуль приложения
 * Инициализирует все компоненты и управляет общей функциональностью
 */

// Запуск приложения при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

// Инициализация приложения
function initApp() {
    // Инициализируем модули
    initTasksModule();
    initNotesModule();
    initCalendarModule();
    
    // Настраиваем переключение вкладок
    setupTabs();
    
    // Настраиваем поиск
    setupSearch();
    
    // Настраиваем модальные окна
    setupModals();
    
    // Отображаем версию приложения
    showAppVersion();
}

// Настройка переключения вкладок
function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Удаляем класс active у всех кнопок и секций
            tabButtons.forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.content-section').forEach(section => {
                section.classList.remove('active');
            });
            
            // Добавляем класс active текущей кнопке и соответствующей секции
            button.classList.add('active');
            const tabId = button.dataset.tab;
            document.getElementById(`${tabId}-section`).classList.add('active');
            
            // Если выбрана вкладка календаря, обновляем его отображение
            if (tabId === 'calendar') {
                renderCalendar();
                updateDayTasks();
            }
        });
    });
}

// Настройка функции поиска
function setupSearch() {
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    
    // Функция для выполнения поиска
    function performSearch() {
        const searchTerm = searchInput.value.trim();
        
        // Определяем активную вкладку
        const activeTab = document.querySelector('.tab-button.active').dataset.tab;
        
        if (activeTab === 'tasks') {
            const tasks = getFromStorage(TASKS_STORAGE_KEY);
            renderTasks(tasks, searchTerm);
        } else if (activeTab === 'notes') {
            const notes = getFromStorage(NOTES_STORAGE_KEY);
            renderNotes(notes, searchTerm);
        }
    }
    
    // Обработчик для кнопки поиска
    searchButton.addEventListener('click', performSearch);
    
    // Обработчик для ввода в поле поиска (поиск при нажатии Enter)
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    // Обработчик для очистки поиска (когда поле становится пустым)
    searchInput.addEventListener('input', () => {
        if (searchInput.value.trim() === '') {
            performSearch();
        }
    });
}

// Настройка обработчиков для модальных окон
function setupModals() {
    // Закрытие модальных окон при клике вне содержимого
    const modals = document.querySelectorAll('.modal');
    
    modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            // Если клик был на фоне модального окна (не на его содержимом)
            if (e.target === modal) {
                modal.classList.remove('show');
                document.body.style.overflow = '';
            }
        });
    });
    
    // Закрытие модальных окон при нажатии Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            modals.forEach(modal => {
                if (modal.classList.contains('show')) {
                    modal.classList.remove('show');
                    document.body.style.overflow = '';
                }
            });
        }
    });
}

// Отображение версии приложения
function showAppVersion() {
    // Здесь можно добавить отображение версии приложения,
    // например в футере или всплывающей подсказке
    console.log('МенеджерЗадач v1.0.0');
}

// Обработка ошибок
window.addEventListener('error', (e) => {
    console.error('Произошла ошибка в приложении:', e.error);
    
    // В реальном приложении здесь можно отправить ошибку на сервер для анализа
    // или показать уведомление пользователю
});
