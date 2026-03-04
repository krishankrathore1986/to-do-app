// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyD_502S2YklL5R5tn6n6MT0TSnrIwfSCh8",
  authDomain: "todo-98be5.firebaseapp.com",
  projectId: "todo-98be5",
  storageBucket: "todo-98be5.firebasestorage.app",
  messagingSenderId: "416960374282",
  appId: "1:416960374282:web:e3d156eb5182e6b838a1f3",
  measurementId: "G-S8LC0KQ9Q2"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const tasksCol = db.collection('tasks');

// State
let tasks = [];
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
const statusEl = document.getElementById('status');

// Show connection status
function setStatus(msg, type) {
  if (!msg) {
    statusEl.classList.add('hidden');
    return;
  }
  statusEl.textContent = msg;
  statusEl.className = 'status ' + (type || '');
}

// Render task list from local state
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

// Add task to Firestore
function addTask() {
  const text = taskInput.value.trim();
  if (!text) return;
  taskInput.value = '';
  tasksCol.add({
    text,
    completed: false,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
}

// Toggle complete in Firestore
function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (task) {
    tasksCol.doc(id).update({ completed: !task.completed });
  }
}

// Delete task from Firestore
function deleteTask(id) {
  tasksCol.doc(id).delete();
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

// Save edit to Firestore
function saveEditTask() {
  const text = editInput.value.trim();
  if (!text) return;
  tasksCol.doc(editingId).update({ text });
  closeModal();
}

function closeModal() {
  editModal.classList.add('hidden');
  editingId = null;
}

// Real-time listener — updates all connected users instantly
setStatus('Connecting...', 'connecting');

tasksCol.orderBy('createdAt').onSnapshot(
  snapshot => {
    tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    render();
    setStatus(null);
  },
  err => {
    console.error(err);
    setStatus('Connection error. Please refresh.', 'error');
  }
);

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
  const batch = db.batch();
  tasks.filter(t => t.completed).forEach(t => batch.delete(tasksCol.doc(t.id)));
  batch.commit();
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
