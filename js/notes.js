/**
 * Модуль для работы с заметками
 */

// Ключ для хранения заметок в localStorage
const NOTES_STORAGE_KEY = 'notes';

// Инициализация модуля заметок
function initNotesModule() {
    loadNotes();
    setupNoteListeners();
}

// Загружает заметки из localStorage и отображает их
function loadNotes() {
    const notes = getFromStorage(NOTES_STORAGE_KEY);
    renderNotes(notes);
}

// Настраивает обработчики событий для функционала заметок
function setupNoteListeners() {
    // Кнопка добавления новой заметки
    document.getElementById('add-note-button').addEventListener('click', () => {
        document.getElementById('note-modal-title').textContent = 'Новая заметка';
        document.getElementById('note-id').value = '';
        resetForm('note-form');
        document.getElementById('note-color').value = '#ffffff'; // Белый цвет по умолчанию
        showModal('note-modal');
    });
    
    // Обработка формы заметки
    document.getElementById('note-form').addEventListener('submit', (e) => {
        e.preventDefault();
        saveNote();
    });
    
    // Кнопка отмены в форме
    document.getElementById('cancel-note').addEventListener('click', () => {
        hideModal('note-modal');
    });
    
    // Закрытие модального окна
    document.querySelectorAll('#note-modal .close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            hideModal('note-modal');
        });
    });
    
    // Сортировка заметок
    document.getElementById('sort-notes').addEventListener('change', updateNotesView);
}

// Отображает список заметок
function renderNotes(notes, searchTerm = '') {
    const notesContainer = document.getElementById('notes-list');
    notesContainer.innerHTML = '';
    
    // Получаем текущее значение сортировки
    const sortValue = document.getElementById('sort-notes').value;
    
    // Применяем фильтрацию и сортировку
    const filteredNotes = filterAndSort(notes, null, sortValue, searchTerm);
    
    // Проверяем, есть ли заметки для отображения
    if (checkEmptyState(filteredNotes, 'notes-list', 'У вас пока нет заметок. Нажмите "Новая заметка", чтобы создать первую заметку.', 'fa-sticky-note')) {
        return;
    }
    
    // Создаем элементы для каждой заметки
    filteredNotes.forEach(note => {
        const noteElement = createNoteElement(note);
        notesContainer.appendChild(noteElement);
    });
}

// Создает DOM-элемент для заметки
function createNoteElement(note) {
    const noteElement = document.createElement('div');
    noteElement.className = 'note-item slide-up';
    noteElement.dataset.id = note.id;
    noteElement.style.backgroundColor = note.color || '#ffffff';
    
    noteElement.innerHTML = `
        <div class="note-title">${note.title}</div>
        <div class="note-content">${note.content}</div>
        <div class="note-date">${formatDateTime(note.timestamp)}</div>
        <div class="note-actions">
            <button class="note-action-button edit" title="Редактировать">
                <i class="fas fa-edit"></i>
            </button>
            <button class="note-action-button delete" title="Удалить">
                <i class="fas fa-trash-alt"></i>
            </button>
        </div>
    `;
    
    // Обработчик для кнопки редактирования
    const editButton = noteElement.querySelector('.edit');
    editButton.addEventListener('click', () => {
        editNote(note.id);
    });
    
    // Обработчик для кнопки удаления
    const deleteButton = noteElement.querySelector('.delete');
    deleteButton.addEventListener('click', () => {
        confirmDeleteNote(note.id);
    });
    
    // Обработчик для клика по заметке (открытие для редактирования)
    noteElement.addEventListener('click', (e) => {
        // Не открываем редактирование, если кликнули по кнопкам действий
        if (!e.target.closest('.note-actions')) {
            editNote(note.id);
        }
    });
    
    return noteElement;
}

// Сохраняет новую или обновляет существующую заметку
function saveNote() {
    // Получаем данные из формы
    const noteId = document.getElementById('note-id').value;
    const title = document.getElementById('note-title').value.trim();
    const content = document.getElementById('note-content').value.trim();
    const color = document.getElementById('note-color').value;
    
    // Проверяем, что заголовок и содержимое не пустые
    if (!title) {
        alert('Пожалуйста, введите заголовок заметки');
        return;
    }
    
    if (!content) {
        alert('Пожалуйста, введите содержимое заметки');
        return;
    }
    
    // Получаем текущие заметки
    const notes = getFromStorage(NOTES_STORAGE_KEY);
    
    // Определяем, это новая заметка или редактирование существующей
    if (noteId) {
        // Обновляем существующую заметку
        const updatedNotes = updateItemById(notes, noteId, {
            title,
            content,
            color,
            lastModified: Date.now()
        });
        
        // Сохраняем в localStorage
        if (saveToStorage(NOTES_STORAGE_KEY, updatedNotes)) {
            renderNotes(updatedNotes);
            hideModal('note-modal');
        }
    } else {
        // Создаем новую заметку
        const newNote = {
            id: generateId(),
            title,
            content,
            color,
            timestamp: Date.now(),
            lastModified: Date.now()
        };
        
        // Добавляем в массив и сохраняем
        const updatedNotes = [newNote, ...notes];
        if (saveToStorage(NOTES_STORAGE_KEY, updatedNotes)) {
            renderNotes(updatedNotes);
            hideModal('note-modal');
        }
    }
}

// Открывает форму редактирования заметки
function editNote(noteId) {
    const notes = getFromStorage(NOTES_STORAGE_KEY);
    const note = findItemById(notes, noteId);
    
    if (!note) {
        alert('Заметка не найдена');
        return;
    }
    
    // Заполняем форму данными заметки
    document.getElementById('note-modal-title').textContent = 'Редактирование заметки';
    document.getElementById('note-id').value = note.id;
    document.getElementById('note-title').value = note.title || '';
    document.getElementById('note-content').value = note.content || '';
    document.getElementById('note-color').value = note.color || '#ffffff';
    
    showModal('note-modal');
}

// Показывает подтверждение удаления заметки
function confirmDeleteNote(noteId) {
    const notes = getFromStorage(NOTES_STORAGE_KEY);
    const note = findItemById(notes, noteId);
    
    if (!note) {
        alert('Заметка не найдена');
        return;
    }
    
    // Настраиваем модальное окно подтверждения
    document.getElementById('confirm-delete-message').textContent = 
        `Вы уверены, что хотите удалить заметку "${note.title}"?`;
    
    // Настраиваем обработчик для кнопки подтверждения
    const confirmButton = document.getElementById('confirm-delete');
    
    // Удаляем предыдущие обработчики, если они были
    const newConfirmButton = confirmButton.cloneNode(true);
    confirmButton.parentNode.replaceChild(newConfirmButton, confirmButton);
    
    // Добавляем новый обработчик
    newConfirmButton.addEventListener('click', () => {
        deleteNote(noteId);
        hideModal('confirm-delete-modal');
    });
    
    // Кнопка отмены
    document.getElementById('cancel-delete').addEventListener('click', () => {
        hideModal('confirm-delete-modal');
    });
    
    showModal('confirm-delete-modal');
}

// Удаляет заметку
function deleteNote(noteId) {
    const notes = getFromStorage(NOTES_STORAGE_KEY);
    const updatedNotes = removeItemById(notes, noteId);
    
    if (saveToStorage(NOTES_STORAGE_KEY, updatedNotes)) {
        renderNotes(updatedNotes);
    }
}

// Обновляет представление заметок на основе текущей сортировки и поиска
function updateNotesView() {
    const notes = getFromStorage(NOTES_STORAGE_KEY);
    const searchTerm = document.getElementById('search-input').value;
    renderNotes(notes, searchTerm);
}
