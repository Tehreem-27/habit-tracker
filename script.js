// DOM Elements
const themeToggle = document.getElementById('themeToggle');
const darkModeToggle = document.getElementById('darkModeToggle');
const habitsList = document.getElementById('habitsList');
const emptyState = document.getElementById('emptyState');
const addHabitBtn = document.getElementById('addHabitBtn');
const habitModal = document.getElementById('habitModal');
const closeModal = document.getElementById('closeModal');
const cancelBtn = document.getElementById('cancelBtn');
const habitForm = document.getElementById('habitForm');
const progressPercentage = document.getElementById('progressPercentage');
const progressCircle = document.getElementById('progressCircle');
const weeklyProgress = document.getElementById('weeklyProgress');
const navBtns = document.querySelectorAll('.nav-btn');
const dashboardView = document.querySelector('.main-content');
const progressView = document.getElementById('progressView');
const settingsView = document.getElementById('settingsView');
const exportDataBtn = document.getElementById('exportData');
const clearDataBtn = document.getElementById('clearData');
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');

// State
let habits = JSON.parse(localStorage.getItem('gentle-habits')) || [];
let editingHabitId = null;
let currentTheme = localStorage.getItem('gentle-habits-theme') || 'light';

// Initialize the app
function init() {
    // Set theme
    if (currentTheme === 'dark') {
        document.body.classList.add('dark-theme');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        darkModeToggle.checked = true;
    }
    
    // Render initial data
    renderHabits();
    updateProgress();
    renderWeeklyProgress();
    renderMonthlyCalendar();
    
    // Set up event listeners
    setupEventListeners();
    
    // Show welcome message if first visit
    if (!localStorage.getItem('gentle-habits-first-visit')) {
        setTimeout(() => {
            alert("Welcome to Gentle Habits! 💫\n\nThis is a pressure-free space to build habits. There are no streaks to maintain, and missed days don't reset progress.\n\nBe kind to yourself. You're doing great.");
            localStorage.setItem('gentle-habits-first-visit', 'true');
        }, 500);
    }
}

// Set up event listeners
function setupEventListeners() {
    // Theme toggle
    themeToggle.addEventListener('click', toggleTheme);
    darkModeToggle.addEventListener('change', toggleTheme);
    
    // Modal
    addHabitBtn.addEventListener('click', openAddHabitModal);
    closeModal.addEventListener('click', closeHabitModal);
    cancelBtn.addEventListener('click', closeHabitModal);
    habitModal.addEventListener('click', (e) => {
        if (e.target === habitModal) closeHabitModal();
    });
    
    // Form submission
    habitForm.addEventListener('submit', saveHabit);
    
    // Navigation
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.getAttribute('data-view');
            switchView(view);
            
            navBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
    
    // Tabs
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            switchTab(tabId);
        });
    });
    
    // Data management
    exportDataBtn.addEventListener('click', exportData);
    clearDataBtn.addEventListener('click', clearData);
}

// Theme functions
function toggleTheme() {
    if (document.body.classList.contains('dark-theme')) {
        document.body.classList.remove('dark-theme');
        localStorage.setItem('gentle-habits-theme', 'light');
        themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        darkModeToggle.checked = false;
    } else {
        document.body.classList.add('dark-theme');
        localStorage.setItem('gentle-habits-theme', 'dark');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        darkModeToggle.checked = true;
    }
}

// View switching
function switchView(view) {
    dashboardView.style.display = 'none';
    progressView.style.display = 'none';
    settingsView.style.display = 'none';
    
    if (view === 'dashboard') {
        dashboardView.style.display = 'grid';
    } else if (view === 'progress') {
        progressView.style.display = 'block';
        renderMonthlyCalendar();
    } else if (view === 'settings') {
        settingsView.style.display = 'block';
    }
}

// Tab switching
function switchTab(tabId) {
    tabs.forEach(tab => {
        tab.classList.remove('active');
        if (tab.getAttribute('data-tab') === tabId) {
            tab.classList.add('active');
        }
    });
    
    tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === `${tabId}Tab`) {
            content.classList.add('active');
        }
    });
}

// Habit functions
function renderHabits() {
    const today = new Date().toDateString();
    
    if (habits.length === 0) {
        emptyState.style.display = 'block';
        habitsList.innerHTML = '';
        return;
    }
    
    emptyState.style.display = 'none';
    
    // Create habit items
    habitsList.innerHTML = habits.map(habit => {
        const isCompleted = habit.completions && habit.completions[today];
        
        return `
            <div class="habit-item" data-id="${habit.id}">
                <label class="habit-check">
                    <input type="checkbox" class="habit-checkbox" ${isCompleted ? 'checked' : ''}>
                </label>
                <div class="habit-info">
                    <div class="habit-name">${habit.name}</div>
                    ${habit.note ? `<div class="habit-note">${habit.note}</div>` : ''}
                </div>
                <div class="habit-actions">
                    <button class="habit-btn edit-btn" title="Edit habit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="habit-btn delete-btn" title="Delete habit">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    // Add event listeners to checkboxes and buttons
    document.querySelectorAll('.habit-checkbox').forEach((checkbox, index) => {
        checkbox.addEventListener('change', (e) => toggleHabitCompletion(e, habits[index].id));
    });
    
    document.querySelectorAll('.edit-btn').forEach((btn, index) => {
        btn.addEventListener('click', () => openEditHabitModal(habits[index].id));
    });
    
    document.querySelectorAll('.delete-btn').forEach((btn, index) => {
        btn.addEventListener('click', () => deleteHabit(habits[index].id));
    });
}

function toggleHabitCompletion(e, habitId) {
    const today = new Date().toDateString();
    const habit = habits.find(h => h.id === habitId);
    
    if (!habit.completions) habit.completions = {};
    
    // Toggle completion status for today
    habit.completions[today] = e.target.checked;
    
    // Save to localStorage
    localStorage.setItem('gentle-habits', JSON.stringify(habits));
    
    // Update UI
    updateProgress();
    renderWeeklyProgress();
    
    // Show gentle feedback
    if (e.target.checked) {
        showEncouragement();
    }
}

function showEncouragement() {
    const encouragements = [
        "Great job! Every step counts.",
        "You're making progress!",
        "Well done! Be proud of this moment.",
        "Celebrate this small win!",
        "You're building consistency!"
    ];
    
    const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];
    
    // Create a temporary notification
    const notification = document.createElement('div');
    notification.textContent = randomEncouragement;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--success-light);
        color: var(--text-primary);
        padding: var(--spacing-sm) var(--spacing-md);
        border-radius: var(--radius);
        border: 1px solid var(--success);
        z-index: 1000;
        animation: fadeIn 0.3s ease, fadeOut 0.3s ease 2.7s;
        max-width: 300px;
        box-shadow: var(--shadow);
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function openAddHabitModal() {
    document.getElementById('modalTitle').textContent = 'Add New Habit';
    document.getElementById('habitId').value = '';
    document.getElementById('habitName').value = '';
    document.getElementById('habitNote').value = '';
    habitModal.style.display = 'flex';
    document.getElementById('habitName').focus();
}

function openEditHabitModal(habitId) {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;
    
    document.getElementById('modalTitle').textContent = 'Edit Habit';
    document.getElementById('habitId').value = habitId;
    document.getElementById('habitName').value = habit.name;
    document.getElementById('habitNote').value = habit.note || '';
    habitModal.style.display = 'flex';
}

function closeHabitModal() {
    habitModal.style.display = 'none';
    habitForm.reset();
}

function saveHabit(e) {
    e.preventDefault();
    
    const habitId = document.getElementById('habitId').value;
    const name = document.getElementById('habitName').value.trim();
    const note = document.getElementById('habitNote').value.trim();
    const today = new Date().toDateString();
    
    if (!name) return;
    
    if (habitId) {
        // Edit existing habit
        const habit = habits.find(h => h.id === habitId);
        if (habit) {
            habit.name = name;
            habit.note = note;
        }
    } else {
        // Add new habit
        const newHabit = {
            id: Date.now().toString(),
            name,
            note,
            created: new Date().toISOString(),
            completions: { [today]: false }
        };
        habits.push(newHabit);
    }
    
    // Save to localStorage
    localStorage.setItem('gentle-habits', JSON.stringify(habits));
    
    // Update UI
    renderHabits();
    updateProgress();
    renderWeeklyProgress();
    
    // Close modal
    closeHabitModal();
}

function deleteHabit(habitId) {
    if (confirm('Are you sure you want to remove this habit? Remember, it\'s okay to let go of things that no longer serve you.')) {
        habits = habits.filter(h => h.id !== habitId);
        localStorage.setItem('gentle-habits', JSON.stringify(habits));
        renderHabits();
        updateProgress();
        renderWeeklyProgress();
    }
}

// Progress functions
function updateProgress() {
    const today = new Date().toDateString();
    const todayHabits = habits.filter(habit => {
        return habit.completions && habit.completions[today] !== undefined;
    });
    
    if (todayHabits.length === 0) {
        progressPercentage.textContent = '0%';
        progressCircle.style.background = 'conic-gradient(var(--success) 0% 0%, var(--neutral) 0% 100%)';
        return;
    }
    
    const completedCount = todayHabits.filter(habit => habit.completions[today]).length;
    const percentage = Math.round((completedCount / todayHabits.length) * 100);
    
    progressPercentage.textContent = `${percentage}%`;
    progressCircle.style.background = `conic-gradient(var(--success) 0% ${percentage}%, var(--neutral) ${percentage}% 100%)`;
}

function renderWeeklyProgress() {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    
    weeklyProgress.innerHTML = '';
    
    // Create progress bars for the last 7 days
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateString = date.toDateString();
        
        // Calculate completion percentage for this day
        const dayHabits = habits.filter(habit => {
            return habit.completions && habit.completions[dateString] !== undefined;
        });
        
        let percentage = 0;
        if (dayHabits.length > 0) {
            const completedCount = dayHabits.filter(habit => habit.completions[dateString]).length;
            percentage = Math.round((completedCount / dayHabits.length) * 100);
        }
        
        const dayName = days[date.getDay()];
        const isToday = i === 0;
        
        weeklyProgress.innerHTML += `
            <div class="day-progress">
                <div class="day-name">${dayName}</div>
                <div class="day-bar">
                    <div class="day-fill" style="height: ${percentage}%"></div>
                </div>
                <div style="font-size: 0.8rem;">${percentage}%</div>
                ${isToday ? '<div style="font-size: 0.7rem; color: var(--accent);">Today</div>' : ''}
            </div>
        `;
    }
}

function renderMonthlyCalendar() {
    const calendarEl = document.getElementById('monthlyCalendar');
    if (!calendarEl) return;
    
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    // Get first day of month and total days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Create calendar header
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    let calendarHTML = '<div class="monthly-calendar">';
    
    // Add day names
    dayNames.forEach(day => {
        calendarHTML += `<div class="calendar-day" style="background: transparent; font-weight: bold;">${day}</div>`;
    });
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay.getDay(); i++) {
        calendarHTML += '<div class="calendar-day"></div>';
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateString = date.toDateString();
        
        // Check if any habits were completed on this day
        let completedCount = 0;
        let totalCount = 0;
        
        habits.forEach(habit => {
            if (habit.completions && habit.completions[dateString] !== undefined) {
                totalCount++;
                if (habit.completions[dateString]) {
                    completedCount++;
                }
            }
        });
        
        const isToday = date.toDateString() === new Date().toDateString();
        const isCompleted = totalCount > 0 && completedCount === totalCount;
        
        calendarHTML += `
            <div class="calendar-day ${isCompleted ? 'completed' : ''} ${isToday ? 'current' : ''}">
                ${day}
            </div>
        `;
    }
    
    calendarHTML += '</div>';
    calendarEl.innerHTML = calendarHTML;
}

// Data management
function exportData() {
    const dataStr = JSON.stringify(habits, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `gentle-habits-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

function clearData() {
    if (confirm('Are you sure you want to clear all your habit data? This cannot be undone.')) {
        habits = [];
        localStorage.removeItem('gentle-habits');
        renderHabits();
        updateProgress();
        renderWeeklyProgress();
        renderMonthlyCalendar();
    }
}

// Initialize the app when page loads
document.addEventListener('DOMContentLoaded', init);