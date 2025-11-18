// --- 1. CORE DATA STORAGE & CALENDAR STATE ---

let events = JSON.parse(localStorage.getItem('lifePlannerEvents')) || [];
let workEmail = localStorage.getItem('lifePlannerWorkEmail') || '';
let currentDateCursor = new Date();


// --- 2. EMAIL SETUP & MANAGEMENT ---

function checkWorkEmailSetup() {
    if (!workEmail) {
        const email = prompt("Please enter your work email address for calendar invites. NOTE: Due to security, the app cannot send emails directly. It will generate a pre-filled email draft (mailto: link) you must send manually.");
        if (email && email.includes('@')) {
            workEmail = email;
            localStorage.setItem('lifePlannerWorkEmail', email);
            alert(`Work email set to: ${email}`);
        } else {
            alert("No valid email set. You can set it later by clearing your browser's local storage.");
        }
    }
}


// --- 3. UTILITY FUNCTIONS: DATES AND TIME ---

function getFormattedDate(dateObj = new Date()) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return dateObj.toLocaleDateString(undefined, options);
}

function getFormattedTime(dateObj = new Date()) {
    const options = { hour: '2-digit', minute: '2-digit' };
    return dateObj.toLocaleTimeString(undefined, options);
}

function formatDateISO(date) {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
}


// --- 4. RENDERING: DASHBOARD VIEW ---

function renderDashboard() {
    const dashboardContent = document.getElementById('dashboard-content');
    if (!dashboardContent) return;

    const today = new Date().toDateString();
    const todayEvents = events.filter(event => 
        new Date(event.date).toDateString() === today
    ).sort((a, b) => (a.time > b.time) ? 1 : -1);

    dashboardContent.innerHTML = `
        <h3 id="current-date">${getFormattedDate()}</h3>
        <p id="current-time">${getFormattedTime()}</p>
        <h4>Your Schedule & Time Blocks Today:</h4>
        <ul id="today-list"></ul>
    `;

    const todayList = document.getElementById('today-list');

    if (todayEvents.length === 0) {
        todayList.innerHTML = '<li>🎉 Nothing scheduled for today!</li>';
        return;
    }

    todayEvents.forEach(event => {
        const itemClass = event.type.replace(/\s/g, '-') + '-item'; // e.g., Work-item
        const listItem = document.createElement('li');
        listItem.className = `dashboard-item ${itemClass}`;
        listItem.innerHTML = `
            <div>
                <strong>[${event.time}] ${event.title}</strong><br>
                <small>Category: ${event.type}</small>
            </div>
        `;
        todayList.appendChild(listItem);
    });
}


// --- 5. CALENDAR VIEW RENDERING LOGIC ---

function showCalendarView(view, date = currentDateCursor) {
    currentDateCursor = date;
    const views = ['day-view', 'week-view', 'month-view'];
    views.forEach(v => {
        document.getElementById(v).style.display = 'none';
    });

    const targetView = document.getElementById(`${view}-view`);
    if (targetView) {
        targetView.style.display = 'block';
    }

    document.querySelectorAll('.calendar-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.calendar-btn[data-view="${view}"]`).classList.add('active');

    if (view === 'day') {
        renderDayView();
    } else if (view === 'week') {
        renderWeekView();
    } else if (view === 'month') {
        renderMonthView();
    }
}

function getEventsForDate(date) {
    const targetDateString = formatDateISO(date);
    return events.filter(event => event.date === targetDateString)
                 .sort((a, b) => (a.time > b.time) ? 1 : -1);
}

function renderDayView() {
    const dayView = document.getElementById('day-view');
    const targetDate = currentDateCursor;
    const dayEvents = getEventsForDate(targetDate);

    dayView.innerHTML = `
        <div class="calendar-navigation">
            <button onclick="navigateCalendar('day', -1)">← Previous</button>
            <h3>${getFormattedDate(targetDate)}</h3>
            <button onclick="navigateCalendar('day', 1)">Next →</button>
        </div>
        <ul></ul>
        <p class="event-summary">Use the Quick Add or Full Scheduler to add events.</p>
    `;

    const ul = dayView.querySelector('ul');
    if (dayEvents.length === 0) {
        ul.innerHTML = '<li>No events scheduled for this day.</li>';
        return;
    }

    dayEvents.forEach((event) => {
        const masterIndex = events.findIndex(e => e.title === event.title && e.date === event.date && e.time === event.time);
        const itemClass = event.type.replace(/\s/g, '-') + '-item';

        const listItem = document.createElement('li');
        listItem.className = `event-item ${itemClass}`;
        listItem.innerHTML = `
            <div class="event-details">
                <strong>[${event.time}] ${event.title}</strong><br>
                <small>Category: ${event.type}</small>
            </div>
            <div class="event-actions">
                <button onclick="shareEvent(${masterIndex})" class="share-btn">Share 📧</button>
                <button onclick="deleteEvent(${masterIndex})" class="delete-btn">Delete</button>
            </div>
        `;
        ul.appendChild(listItem);
    });
}

function renderWeekView() {
    const weekView = document.getElementById('week-view');
    const startOfWeek = new Date(currentDateCursor);
    startOfWeek.setDate(currentDateCursor.getDate() - currentDateCursor.getDay());
    
    weekView.innerHTML = `
        <div class="calendar-navigation">
            <button onclick="navigateCalendar('week', -7)">← Prev Week</button>
            <h3>Week of ${getFormattedDate(startOfWeek)}</h3>
            <button onclick="navigateCalendar('week', 7)">Next Week →</button>
        </div>
        <div class="week-grid">
            <div class="day-name">Sun</div><div class="day-name">Mon</div><div class="day-name">Tue</div><div class="day-name">Wed</div><div class="day-name">Thu</div><div class="day-name">Fri</div><div class="day-name">Sat</div>
        </div>
    `;

    const gridContainer = weekView.querySelector('.week-grid');

    for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        const dayEvents = getEventsForDate(date);
        
        const dayBox = document.createElement('div');
        dayBox.className = `calendar-day-box`;
        if (date.toDateString() === new Date().toDateString()) {
            dayBox.classList.add('today-box');
        }
        
        const summary = dayEvents.slice(0, 3).map(e => {
            const dotClass = e.type.replace(/\s/g, '-') + '-dot';
            return `<div class="event-summary"><span class="category-dot ${dotClass}"></span> ${e.time}</div>`;
        }).join('');

        dayBox.innerHTML = `
            <strong>${date.getDate()}</strong>
            ${summary}
            ${dayEvents.length > 3 ? `<div class="event-summary">...${dayEvents.length - 3} more</div>` : ''}
        `;
        gridContainer.appendChild(dayBox);
    }
}

function renderMonthView() {
    const monthView = document.getElementById('month-view');
    const year = currentDateCursor.getFullYear();
    const month = currentDateCursor.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDay = firstDayOfMonth.getDay();
    
    monthView.innerHTML = `
        <div class="calendar-navigation">
            <button onclick="navigateCalendar('month', -1)">← Prev Month</button>
            <h3>${firstDayOfMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
            <button onclick="navigateCalendar('month', 1)">Next Month →</button>
        </div>
        <div class="month-grid">
            <div class="day-name">Sun</div><div class="day-name">Mon</div><div class="day-name">Tue</div><div class="day-name">Wed</div><div class="day-name">Thu</div><div class="day-name">Fri</div><div class="day-name">Sat</div>
        </div>
    `;
    const gridContainer = monthView.querySelector('.month-grid');

    for (let i = 0; i < startDay; i++) {
        gridContainer.innerHTML += '<div class="calendar-day-box"></div>';
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dayEvents = getEventsForDate(date);
        
        const dayBox = document.createElement('div');
        dayBox.className = `calendar-day-box current-month-day`;
        if (date.toDateString() === new Date().toDateString()) {
            dayBox.classList.add('today-box');
        }

        const uniqueTypes = [...new Set(dayEvents.map(e => e.type))];
        const dots = uniqueTypes.map(type => `<span class="category-dot ${type.replace(/\s/g, '-')}-dot"></span>`).join('');
        
        dayBox.innerHTML = `
            <strong>${day}</strong>
            <div class="dots-container">${dots}</div>
        `;
        gridContainer.appendChild(dayBox);
    }
}

function navigateCalendar(view, amount) {
    if (view === 'day') {
        currentDateCursor.setDate(currentDateCursor.getDate() + amount);
    } else if (view === 'week') {
        currentDateCursor.setDate(currentDateCursor.getDate() + amount);
    } else if (view === 'month') {
        currentDateCursor.setMonth(currentDateCursor.getMonth() + amount);
    }
    showCalendarView(view, currentDateCursor);
}


// --- 6. EVENT MANIPULATION: SAVE, DELETE, SHARE ---

function deleteEvent(index) {
    if (confirm("Are you sure you want to delete this time block?")) {
        events.splice(index, 1); 
        localStorage.setItem('lifePlannerEvents', JSON.stringify(events)); 

        const activeView = document.querySelector('.calendar-btn.active').dataset.view;
        showCalendarView(activeView, currentDateCursor);
        renderDashboard();
    }
}

function shareEvent(index) {
    if (!workEmail) {
        alert("Work email is not set up. Setting it up now...");
        checkWorkEmailSetup();
        if (!workEmail) return;
    }

    const event = events[index];
    const eventTime = `${event.date} ${event.time}`;
    const dateObj = new Date(eventTime);

    const icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:${event.title} (${event.type})\nDTSTART:${dateObj.toISOString().replace(/[-:]|\.\d{3}/g, '')}Z\nDURATION:PT30M\nEND:VEVENT\nEND:VCALENDAR`;
    
    // Use the stored workEmail
    const mailtoLink = `mailto:${workEmail}?subject=Calendar Invite: ${event.title}&body=Hello,%0A%0AHere is the calendar invite for your ${event.type} event. Please copy the iCal content below or use the 'webcal' option to import.%0A%0A----%0A%0A${icsContent}`;

    const shareMessage = `Sharing event '${event.title}':\n\n1. Work Calendar: Click OK to open an email draft to ${workEmail}.\n\n2. Personal Calendar (Automation): For Apple Shortcut, copy this text:\n\n${event.title} at ${event.time} on ${event.date}`;

    alert(shareMessage);
    
    window.location.href = mailtoLink;
}

// Full form save (Calendar section)
function saveEvent(e) {
    e.preventDefault(); 

    const title = document.getElementById('event-title').value;
    const type = document.getElementById('event-type').value;
    const date = document.getElementById('event-date').value;
    const time = document.getElementById('event-time').value;

    const newEvent = { title, type, date, time };
    events.push(newEvent);
    localStorage.setItem('lifePlannerEvents', JSON.stringify(events));

    document.getElementById('add-event-form').reset();
    
    currentDateCursor = new Date(date);
    showCalendarView('day', currentDateCursor); 
    renderDashboard();

    alert(`Successfully added "${title}"! Now click "Share 📧" to add it to your external calendars.`);
}

// Quick Add form save (UPDATED)
function saveQuickEvent(e) {
    e.preventDefault();
    
    const title = document.getElementById('quick-title').value;
    // Read the new type selection
    const type = document.getElementById('quick-type').value; 
    const date = document.getElementById('quick-date').value;
    const time = document.getElementById('quick-time').value;

    const newEvent = { title, type, date, time };
    events.push(newEvent);
    localStorage.setItem('lifePlannerEvents', JSON.stringify(events));

    document.getElementById('quick-add-form').reset();
    
    // Reset date input to today for future quick adds
    document.getElementById('quick-date').value = formatDateISO(new Date()); 

    renderDashboard();

    alert(`Quick Event "${title}" added (${type}). Find it in the Day View.`);
}


// --- 7. NAVIGATION AND INITIALIZATION ---

function handleNavigation() {
    const navLinks = document.querySelectorAll('#navigation a');
    const sections = document.querySelectorAll('.app-section');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = e.target.getAttribute('href').substring(1);

            sections.forEach(section => {
                if (section.id !== 'quick-add-section') {
                    section.style.display = 'none';
                }
            });
            
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.style.display = 'block';

                if (targetId === 'dashboard') {
                    renderDashboard();
                }
            }
            
            navLinks.forEach(l => l.classList.remove('active'));
            e.target.classList.add('active');
        });
    });
}


// --- 8. PWA SERVICE WORKER REGISTRATION ---
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/service-worker.js')
                .then(registration => {
                    console.log('ServiceWorker registration successful:', registration.scope);
                })
                .catch(error => {
                    console.error('ServiceWorker registration failed:', error);
                });
        });
    }
}


// Wait until the entire HTML document is loaded before running the script
document.addEventListener('DOMContentLoaded', () => {
    // 1. Check and prompt for work email setup
    checkWorkEmailSetup();

    // 2. Set default date for Quick Add form to today
    document.getElementById('quick-date').value = formatDateISO(new Date());

    // 3. Set up navigation logic
    handleNavigation();

    // 4. Attach the save functions
    document.getElementById('add-event-form').addEventListener('submit', saveEvent);
    document.getElementById('quick-add-form').addEventListener('submit', saveQuickEvent);

    // 5. Attach listeners for the new calendar view toggles
    document.querySelectorAll('.calendar-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            showCalendarView(e.target.dataset.view);
        });
    });

    // 6. Render initial views (Dashboard is default)
    renderDashboard();
    
    // 7. Render the default calendar view (Day View)
    showCalendarView('day', new Date());

    // 8. Register the Service Worker
    registerServiceWorker();

    // 9. Set up a timer to update the clock every minute
    setInterval(() => {
        const timeElement = document.getElementById('current-time');
        if (timeElement) {
            timeElement.textContent = getFormattedTime();
        }
    }, 60000); 
});