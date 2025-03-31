/**
 * Утилиты для работы с приложением
 */

// Генерирует уникальный идентификатор
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// Форматирует дату в локальный формат
function formatDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

// Форматирует дату и время для отображения в карточке
function formatDateTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Возвращает строку с давностью времени (например, "5 минут назад")
function timeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    let interval = Math.floor(seconds / 31536000);
    if (interval > 1) {
        return `${interval} ${pluralize(interval, 'год', 'года', 'лет')} назад`;
    }
    
    interval = Math.floor(seconds / 2592000);
    if (interval > 1) {
        return `${interval} ${pluralize(interval, 'месяц', 'месяца', 'месяцев')} назад`;
    }
    
    interval = Math.floor(seconds / 86400);
    if (interval > 1) {
        return `${interval} ${pluralize(interval, 'день', 'дня', 'дней')} назад`;
    }
    
    interval = Math.floor(seconds / 3600);
    if (interval > 1) {
        return `${interval} ${pluralize(interval, 'час', 'часа', 'часов')} назад`;
    }
    
    interval = Math.floor(seconds / 60);
    if (interval > 1) {
        return `${interval} ${pluralize(interval, 'минуту', 'минуты', 'минут')} назад`;
    }
    
    if (seconds < 10) return 'только что';
    
    return `${seconds} ${pluralize(seconds, 'секунду', 'секунды', 'секунд')} назад`;
}

// Функция для правильного склонения русских слов
function pluralize(count, one, few, many) {
    if (count % 10 === 1 && count % 100 !== 11) {
        return one;
    } else if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) {
        return few;
    } else {
        return many;
    }
}

// Получает значение из LocalStorage
function getFromStorage(key, defaultValue = []) {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : defaultValue;
    } catch (error) {
        console.error('Ошибка при чтении из LocalStorage:', error);
        return defaultValue;
    }
}

// Сохраняет значение в LocalStorage
function saveToStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error('Ошибка при сохранении в LocalStorage:', error);
        alert('Произошла ошибка при сохранении данных. Возможно, память браузера переполнена.');
        return false;
    }
}

// Удаляет элемент из массива по ID
function removeItemById(array, id) {
    return array.filter(item => item.id !== id);
}

// Обновляет элемент в массиве по ID
function updateItemById(array, id, updatedItem) {
    return array.map(item => item.id === id ? {...item, ...updatedItem} : item);
}

// Находит элемент в массиве по ID
function findItemById(array, id) {
    return array.find(item => item.id === id);
}

// Показывает модальное окно
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('show');
    
    // Анимация появления
    setTimeout(() => {
        modal.querySelector('.modal-content').classList.add('fade-in');
    }, 50);
    
    // Блокируем прокрутку на заднем фоне
    document.body.style.overflow = 'hidden';
}

// Скрывает модальное окно
function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('show');
    
    // Разблокируем прокрутку
    document.body.style.overflow = '';
}

// Очищает форму
function resetForm(formId) {
    document.getElementById(formId).reset();
}

// Фильтрует и сортирует массив элементов
function filterAndSort(items, filterValue, sortValue, searchTerm = '') {
    // Фильтрация
    let filteredItems = [...items];
    
    // Применение поиска, если есть
    if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filteredItems = filteredItems.filter(item => 
            (item.title && item.title.toLowerCase().includes(searchLower)) || 
            (item.description && item.description.toLowerCase().includes(searchLower)) ||
            (item.content && item.content.toLowerCase().includes(searchLower))
        );
    }
    
    // Фильтрация для задач
    if (filterValue && filterValue !== 'all') {
        if (filterValue === 'active') {
            filteredItems = filteredItems.filter(item => !item.completed);
        } else if (filterValue === 'completed') {
            filteredItems = filteredItems.filter(item => item.completed);
        }
    }
    
    // Сортировка
    if (sortValue) {
        switch (sortValue) {
            case 'date-asc':
                filteredItems.sort((a, b) => a.timestamp - b.timestamp);
                break;
            case 'date-desc':
                filteredItems.sort((a, b) => b.timestamp - a.timestamp);
                break;
            case 'priority-asc':
                const priorityOrder = {low: 1, medium: 2, high: 3};
                filteredItems.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
                break;
            case 'priority-desc':
                const priorityOrderDesc = {low: 3, medium: 2, high: 1};
                filteredItems.sort((a, b) => priorityOrderDesc[a.priority] - priorityOrderDesc[b.priority]);
                break;
            case 'title-asc':
                filteredItems.sort((a, b) => a.title.localeCompare(b.title, 'ru'));
                break;
            case 'title-desc':
                filteredItems.sort((a, b) => b.title.localeCompare(a.title, 'ru'));
                break;
            default:
                break;
        }
    }
    
    return filteredItems;
}

// Показывает пустое состояние
function showEmptyState(containerId, message, icon = 'fa-clipboard-list') {
    const container = document.getElementById(containerId);
    container.innerHTML = `
        <div class="empty-state">
            <i class="fas ${icon}"></i>
            <p>${message}</p>
        </div>
    `;
}

// Проверяет наличие данных и показывает пустое состояние при необходимости
function checkEmptyState(items, containerId, message, icon) {
    if (!items || items.length === 0) {
        showEmptyState(containerId, message, icon);
        return true;
    }
    return false;
}
