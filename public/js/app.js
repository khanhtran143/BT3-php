const DAY_NAMES = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
const HOUR_START = 7;
const HOUR_END = 18;
const HOUR_HEIGHT = 72;

const state = {
  currentTeacher: null,
  teachers: [],
  rooms: [],
  bookings: [],
  currentWeekStart: '',
  teacherFilter: '',
};

const loginScreen = document.querySelector('#login-screen');
const appShell = document.querySelector('#app-shell');
const loginForm = document.querySelector('#login-form');
const loginMessage = document.querySelector('#login-message');
const logoutButton = document.querySelector('#logout-button');
const summaryCards = document.querySelector('#summary-cards');
const scheduleGrid = document.querySelector('#schedule-grid');
const bookingListContainer = document.querySelector('#booking-list-container');
const weekTitle = document.querySelector('#week-title');
const teacherFilter = document.querySelector('#teacher-filter');
const teacherSelect = document.querySelector('#teacher-select');
const roomSelect = document.querySelector('#room-select');
const weekStartInput = document.querySelector('#week-start-input');
const bookingDateInput = document.querySelector('#booking-date');
const form = document.querySelector('#booking-form-element');
const formMessage = document.querySelector('#form-message');
const profileName = document.querySelector('#profile-name');
const profileDepartment = document.querySelector('#profile-department');
const profileAvatar = document.querySelector('#profile-avatar');
const printWeekButton = document.querySelector('#print-week');
const exportPdfButton = document.querySelector('#export-pdf');

function formatDateLabel(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
}

function addDays(dateString, amount) {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + amount);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getDayIndex(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return (date.getDay() + 6) % 7;
}

function timeToMinutes(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error || 'Không thể tải dữ liệu.');
    error.statusCode = response.status;
    throw error;
  }

  return payload;
}

function showLoginScreen(message = '') {
  loginScreen.classList.remove('hidden');
  appShell.classList.add('hidden');
  loginMessage.textContent = message;
}

function showApp() {
  loginScreen.classList.add('hidden');
  appShell.classList.remove('hidden');
}

function redirectAdminToDashboard(teacher) {
  if (teacher?.isAdmin) {
    window.location.href = '/admin.html';
    return true;
  }

  return false;
}

function renderProfile() {
  if (!state.currentTeacher) {
    return;
  }

  profileName.textContent = state.currentTeacher.fullName;
  profileDepartment.textContent = `${state.currentTeacher.department} | ${state.currentTeacher.email}`;
  profileAvatar.textContent = state.currentTeacher.fullName
    .split(' ')
    .slice(-2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

function populateTeacherControls(teachers) {
  const filterOptions = [
    '<option value="">Tất cả giảng viên</option>',
    ...teachers.map(
      (teacher) =>
        `<option value="${teacher.id}">${escapeHtml(teacher.fullName)} - ${escapeHtml(teacher.department)}</option>`,
    ),
  ].join('');

  teacherFilter.innerHTML = filterOptions;
  teacherFilter.value = state.teacherFilter || '';

  if (state.currentTeacher) {
    teacherSelect.innerHTML = `<option value="${state.currentTeacher.id}">${escapeHtml(
      state.currentTeacher.fullName,
    )} - ${escapeHtml(state.currentTeacher.department)}</option>`;
    teacherSelect.value = String(state.currentTeacher.id);
    teacherSelect.disabled = true;
  }
}

function populateRooms(rooms) {
  roomSelect.innerHTML =
    '<option value="">Chọn phòng máy</option>' +
    rooms.map((room) => `<option value="${escapeHtml(room)}">${escapeHtml(room)}</option>`).join('');
}

function renderSummary(summary) {
  const myBookings = state.bookings.filter((booking) => booking.teacherId === state.currentTeacher?.id).length;
  const cards = [
    { label: 'Tổng lịch trong tuần', value: summary.totalBookings },
    { label: 'Lịch của tôi', value: myBookings },
    { label: 'Phòng máy sử dụng', value: summary.totalRooms },
  ];

  summaryCards.innerHTML = cards
    .map(
      (card) => `
        <article class="summary-card">
          <p>${card.label}</p>
          <strong>${card.value}</strong>
        </article>
      `,
    )
    .join('');
}

function buildScheduleShell(weekStart) {
  const dayHeaders = DAY_NAMES.map((label, index) => {
    const date = addDays(weekStart, index);
    return `
      <div class="day-head">
        ${label}
        <span>${formatDateLabel(date)}</span>
      </div>
    `;
  }).join('');

  const timeSlots = Array.from({ length: HOUR_END - HOUR_START }, (_, index) => {
    const hour = HOUR_START + index;
    return `
      <div class="time-slot">
        <strong>Tiết ${index + 1}</strong>
        <span>${String(hour).padStart(2, '0')}:00</span>
      </div>
    `;
  }).join('');

  const dayColumns = DAY_NAMES.map(() => '<div class="day-column"></div>').join('');

  scheduleGrid.innerHTML = `
    <div class="schedule-head">
      <div class="corner-head">Ca học</div>
      ${dayHeaders}
    </div>
    <div class="schedule-body">
      <div class="time-axis">${timeSlots}</div>
      <div class="days-area" id="days-area">
        <div class="days-columns">${dayColumns}</div>
      </div>
    </div>
  `;
}

function renderSchedule(weekStart, bookings) {
  buildScheduleShell(weekStart);

  const daysArea = document.querySelector('#days-area');
  const totalMinutes = (HOUR_END - HOUR_START) * 60;
  const boardHeight = (HOUR_END - HOUR_START) * HOUR_HEIGHT;
  daysArea.style.minHeight = `${boardHeight}px`;

  if (!bookings.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.style.position = 'absolute';
    empty.style.inset = '24px';
    empty.textContent = 'Tuần này chưa có lịch thực hành nào phù hợp với bộ lọc hiện tại.';
    daysArea.append(empty);
    return;
  }

  bookings.forEach((booking) => {
    const topMinutes = timeToMinutes(booking.startTime) - HOUR_START * 60;
    const durationMinutes = timeToMinutes(booking.endTime) - timeToMinutes(booking.startTime);
    const dayIndex = getDayIndex(booking.date);
    const canDelete = booking.teacherId === state.currentTeacher?.id;

    const card = document.createElement('article');
    card.className = 'booking-card';
    card.style.left = `calc(${dayIndex} * (100% / 7) + 6px)`;
    card.style.top = `${(topMinutes / totalMinutes) * boardHeight + 6}px`;
    card.style.height = `${Math.max((durationMinutes / totalMinutes) * boardHeight - 12, 104)}px`;

    card.innerHTML = `
      <h4>${escapeHtml(booking.subjectName)} (${escapeHtml(booking.subjectCode)})</h4>
      <p><strong>Lớp:</strong> ${escapeHtml(booking.classGroup)}</p>
      <p><strong>GV:</strong> ${escapeHtml(booking.teacherName)}</p>
      <p><strong>Phòng:</strong> ${escapeHtml(booking.room)}</p>
      <p><strong>Nội dung:</strong> ${escapeHtml(booking.practiceTopic)}</p>
      <p class="booking-time">${escapeHtml(booking.startTime)} - ${escapeHtml(booking.endTime)}</p>
      <div class="booking-meta">
        <span>${escapeHtml(formatDateLabel(booking.date))}</span>
        ${canDelete
        ? `<button class="remove-button" type="button" data-booking-id="${booking.id}">Xóa</button>`
        : '<span class="field-hint">Lịch của giảng viên khác</span>'
      }
      </div>
    `;

    daysArea.append(card);
  });
}

function renderBookingList(bookings) {
  if (!bookings.length) {
    bookingListContainer.innerHTML = '<div class="empty-state">Chưa có lịch nào trong tuần đang chọn.</div>';
    return;
  }

  bookingListContainer.innerHTML = bookings
    .map((booking) => {
      const canDelete = booking.teacherId === state.currentTeacher?.id;

      return `
        <article class="booking-list-item">
          <div>
            <h4>${escapeHtml(booking.subjectName)} - ${escapeHtml(booking.classGroup)}</h4>
            <p>${escapeHtml(booking.teacherName)} | ${escapeHtml(booking.department)}</p>
            <p>${escapeHtml(formatDateLabel(booking.date))} | ${escapeHtml(booking.startTime)} - ${escapeHtml(
        booking.endTime,
      )}</p>
            <p>${escapeHtml(booking.room)} | ${escapeHtml(booking.practiceTopic)}</p>
            <p>${escapeHtml(booking.note || 'Không có ghi chú bổ sung.')}</p>
          </div>
          <div>
            ${canDelete
          ? `<button class="remove-button" type="button" data-booking-id="${booking.id}">Xóa lịch</button>`
          : '<span class="field-hint">Chỉ xem</span>'
        }
          </div>
        </article>
      `;
    })
    .join('');
}

function getPrintUrl(mode) {
  const params = new URLSearchParams({
    weekStart: state.currentWeekStart,
  });

  if (state.teacherFilter) {
    params.set('teacherId', state.teacherFilter);
  }

  if (mode) {
    params.set('mode', mode);
    params.set('autoPrint', '1');
  }

  return `/print.html?${params.toString()}`;
}

async function loadSchedule() {
  const teacherId = state.teacherFilter ? `&teacherId=${state.teacherFilter}` : '';
  const data = await requestJson(`/api.php?action=schedule&weekStart=${state.currentWeekStart}${teacherId}`);

  state.bookings = data.bookings;
  renderSummary(data.summary);
  renderSchedule(data.weekStart, data.bookings);
  renderBookingList(data.bookings);
  weekTitle.textContent = `Tuần từ ${formatDateLabel(data.weekStart)} đến ${formatDateLabel(data.weekEnd)}`;
}

async function safeLoadSchedule() {
  try {
    await loadSchedule();
  } catch (error) {
    formMessage.textContent = error.message;
    if (error.statusCode === 401) {
      showLoginScreen('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }
  }
}

async function bootstrapApp() {
  const meta = await requestJson('/api.php?action=meta');

  state.currentTeacher = meta.currentTeacher;
  state.teachers = meta.teachers;
  state.rooms = meta.rooms;
  state.currentWeekStart = meta.defaultWeekStart;
  state.teacherFilter = String(meta.currentTeacher?.id || '');

  renderProfile();
  populateTeacherControls(meta.teachers);
  populateRooms(meta.rooms);

  weekStartInput.value = state.currentWeekStart;
  bookingDateInput.value = state.currentWeekStart;

  showApp();
  await safeLoadSchedule();
}

async function checkSession() {
  const session = await requestJson('/api.php?action=session');

  if (!session.authenticated) {
    showLoginScreen('');
    return;
  }

  if (redirectAdminToDashboard(session.teacher)) {
    return;
  }

  await bootstrapApp();
}

async function handleLoginSubmit(event) {
  event.preventDefault();
  loginMessage.textContent = 'Đang xác thực tài khoản...';

  const formData = new FormData(loginForm);
  const payload = Object.fromEntries(formData.entries());

  try {
    const result = await requestJson('/api.php?action=auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (redirectAdminToDashboard(result.teacher)) {
      return;
    }

    loginMessage.textContent = '';
    await bootstrapApp();
  } catch (error) {
    loginMessage.textContent = error.message;
  }
}

async function handleLogout() {
  await requestJson('/api.php?action=auth/logout', { method: 'POST' });
  state.currentTeacher = null;
  state.bookings = [];
  formMessage.textContent = '';
  showLoginScreen('Bạn đã đăng xuất.');
}

async function handleFormSubmit(event) {
  event.preventDefault();
  formMessage.textContent = 'Đang lưu lịch thực hành...';

  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());

  try {
    await requestJson('/api.php?action=bookings', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    form.reset();
    roomSelect.value = '';
    bookingDateInput.value = state.currentWeekStart;
    teacherSelect.value = String(state.currentTeacher.id);
    formMessage.textContent = 'Đã lưu lịch thực hành thành công.';
    await safeLoadSchedule();
  } catch (error) {
    formMessage.textContent = error.message;
    if (error.statusCode === 401) {
      showLoginScreen('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }
  }
}

async function handleDeleteClick(event) {
  const button = event.target.closest('[data-booking-id]');
  if (!button) {
    return;
  }

  const bookingId = button.dataset.bookingId;
  const confirmed = window.confirm('Bạn có chắc muốn xóa lịch đăng ký này không?');
  if (!confirmed) {
    return;
  }

  try {
    await requestJson(`/api.php?action=bookings&id=${bookingId}`, { method: 'DELETE' });
    formMessage.textContent = 'Đã xóa lịch đăng ký.';
    await safeLoadSchedule();
  } catch (error) {
    formMessage.textContent = error.message;
    if (error.statusCode === 401) {
      showLoginScreen('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }
  }
}

teacherFilter.addEventListener('change', async (event) => {
  state.teacherFilter = event.target.value;
  await safeLoadSchedule();
});

weekStartInput.addEventListener('change', async (event) => {
  state.currentWeekStart = event.target.value;
  bookingDateInput.value = state.currentWeekStart;
  await safeLoadSchedule();
});

document.querySelector('#prev-week').addEventListener('click', async () => {
  state.currentWeekStart = addDays(state.currentWeekStart, -7);
  weekStartInput.value = state.currentWeekStart;
  bookingDateInput.value = state.currentWeekStart;
  await safeLoadSchedule();
});

document.querySelector('#next-week').addEventListener('click', async () => {
  state.currentWeekStart = addDays(state.currentWeekStart, 7);
  weekStartInput.value = state.currentWeekStart;
  bookingDateInput.value = state.currentWeekStart;
  await safeLoadSchedule();
});

printWeekButton.addEventListener('click', () => {
  window.open(getPrintUrl('print'), '_blank', 'noopener');
});

exportPdfButton.addEventListener('click', () => {
  window.open(getPrintUrl('pdf'), '_blank', 'noopener');
});

loginForm.addEventListener('submit', handleLoginSubmit);
logoutButton.addEventListener('click', handleLogout);
form.addEventListener('submit', handleFormSubmit);
document.addEventListener('click', handleDeleteClick);

checkSession().catch((error) => {
  showLoginScreen(error.message);
});
