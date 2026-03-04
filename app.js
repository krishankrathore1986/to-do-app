// State
let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
let currentFilter = 'all';
let editingId = null;

// DOM refs
const taskInput = document.getElementById('taskInput');
const addBtn = document.getElementById('addBtn');
const taskList = document.getElementById('taskList');
const taskCount = document.getElementById('taskCount');
const clearCompleted = document.getElementById('clearCompleted');
const filterBtns = document.querySelectorAll('.filter-btn');
const editModal = document.getElementById('editModal');
const editInput = document.getElementById('editInput');
const saveEdit = document.getElementById('saveEdit');
const cancelEdit = document.getElementById('cancelEdit');

// Save to localStorage
function save() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Generate unique ID
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// Render task list
function render() {
  const filtered = tasks.filter(t => {
    if (currentFilter === 'active') return !t.completed;
    if (currentFilter === 'completed') return t.completed;
    return true;
  });

  taskList.innerHTML = '';

  if (filtered.length === 0) {
    taskList.innerHTML = '<li class="empty-state">No tasks here!</li>';
  } else {
    filtered.forEach(task => {
      const li = document.createElement('li');
      li.className = 'task-item' + (task.completed ? ' completed' : '');
      li.dataset.id = task.id;

      li.innerHTML = `
        <input type="checkbox" ${task.completed ? 'checked' : ''} aria-label="Toggle task" />
        <span class="task-text">${escapeHtml(task.text)}</span>
        <div class="task-actions">
          <button class="edit-btn">Edit</button>
          <button class="delete-btn">Delete</button>
        </div>
      `;

      taskList.appendChild(li);
    });
  }

  // Update count (active tasks)
  const active = tasks.filter(t => !t.completed).length;
  taskCount.textContent = `${active} task${active !== 1 ? 's' : ''} left`;
}

// Escape HTML to prevent XSS
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Add task
function addTask() {
  const text = taskInput.value.trim();
  if (!text) return;
  tasks.push({ id: uid(), text, completed: false });
  taskInput.value = '';
  save();
  render();
}

// Toggle complete
function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.completed = !task.completed;
    save();
    render();
  }
}

// Delete task
function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  save();
  render();
}

// Open edit modal
function openEdit(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  editingId = id;
  editInput.value = task.text;
  editModal.classList.remove('hidden');
  editInput.focus();
}

// Save edit
function saveEditTask() {
  const text = editInput.value.trim();
  if (!text) return;
  const task = tasks.find(t => t.id === editingId);
  if (task) {
    task.text = text;
    save();
    render();
  }
  closeModal();
}

function closeModal() {
  editModal.classList.add('hidden');
  editingId = null;
}

// Event: Add button / Enter key
addBtn.addEventListener('click', addTask);
taskInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') addTask();
});

// Event: Task list (checkbox, edit, delete)
taskList.addEventListener('click', e => {
  const li = e.target.closest('.task-item');
  if (!li) return;
  const id = li.dataset.id;

  if (e.target.matches('input[type="checkbox"]')) toggleTask(id);
  else if (e.target.matches('.edit-btn')) openEdit(id);
  else if (e.target.matches('.delete-btn')) deleteTask(id);
});

// Event: Filters
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    render();
  });
});

// Event: Clear completed
clearCompleted.addEventListener('click', () => {
  tasks = tasks.filter(t => !t.completed);
  save();
  render();
});

// Event: Modal save/cancel
saveEdit.addEventListener('click', saveEditTask);
cancelEdit.addEventListener('click', closeModal);
editInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') saveEditTask();
  if (e.key === 'Escape') closeModal();
});
editModal.addEventListener('click', e => {
  if (e.target === editModal) closeModal();
});

// Initial render
render();
