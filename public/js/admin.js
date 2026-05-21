const state = {
  currentAdmin: null,
  currentModule: 'dashboard',
  dashboard: null,
  teachers: [],
  rooms: [],
  roomNames: [],
  subjects: [],
  students: [],
  bookings: [],
  page: 1,
  pageSize: 8,
  sortKey: '',
  sortDirection: 'asc',
  editingId: null,
  bookingFilters: {
    date: '',
    teacherId: '',
    room: '',
  },
};

const loginScreen = document.querySelector('#admin-login');
const loginForm = document.querySelector('#admin-login-form');
const loginMessage = document.querySelector('#admin-login-message');
const shell = document.querySelector('#admin-shell');
const pageTitle = document.querySelector('#page-title');
const adminName = document.querySelector('#admin-name');
const adminEmail = document.querySelector('#admin-email');
const adminAvatar = document.querySelector('#admin-avatar');
const logoutButton = document.querySelector('#admin-logout');
const themeToggle = document.querySelector('#theme-toggle');
const dashboardView = document.querySelector('#dashboard-view');
const moduleView = document.querySelector('#module-view');
const reportsView = document.querySelector('#reports-view');
const statsGrid = document.querySelector('#stats-grid');
const scheduleChart = document.querySelector('#schedule-chart');
const roomChart = document.querySelector('#room-chart');
const recentBookings = document.querySelector('#recent-bookings');
const moduleTag = document.querySelector('#module-tag');
const moduleTitle = document.querySelector('#module-title');
const addButton = document.querySelector('#add-button');

const tableHead = document.querySelector('#data-table-head');
const tableBody = document.querySelector('#data-table-body');
const pageInfo = document.querySelector('#page-info');
const prevPage = document.querySelector('#prev-page');
const nextPage = document.querySelector('#next-page');
const scheduleFilters = document.querySelector('#schedule-filters');
const filterDate = document.querySelector('#filter-date');
const filterTeacher = document.querySelector('#filter-teacher');
const filterRoom = document.querySelector('#filter-room');
const clearFilters = document.querySelector('#clear-filters');
const calendarPanel = document.querySelector('#calendar-panel');
const calendarBoard = document.querySelector('#calendar-board');
const reportGrid = document.querySelector('#report-grid');
const formDialog = document.querySelector('#form-dialog');
const entityForm = document.querySelector('#entity-form');
const modalTitle = document.querySelector('#modal-title');
const modalTag = document.querySelector('#modal-tag');
const modalFields = document.querySelector('#modal-fields');
const cancelModal = document.querySelector('#cancel-modal');
const modalClose = document.querySelector('#modal-close');
const toastStack = document.querySelector('#toast-stack');

const moduleConfigs = {
  teachers: {
    title: 'Quản lý giảng viên',
    tag: 'Nhân sự đào tạo',
    endpoint: '/api.php?action=admin/teachers',
    dataKey: 'teachers',
    createLabel: 'Thêm giảng viên',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'fullName', label: 'Tên' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'SĐT' },
      { key: 'department', label: 'Bộ môn' },
      { key: 'isAdmin', label: 'Quyền', format: (row) => (row.isAdmin ? 'Admin' : 'Giảng viên') },
    ],
    fields: [
      { name: 'fullName', label: 'Tên giảng viên', required: true },
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'phone', label: 'Số điện thoại', required: true },
      { name: 'department', label: 'Bộ môn', required: true },
      { name: 'password', label: 'Mật khẩu', type: 'password', placeholder: 'Để trống nếu không đổi' },
      { name: 'isAdmin', label: 'Cấp quyền admin', type: 'checkbox' },
    ],
  },
  bookings: {
    title: 'Quản lý lịch thực hành',
    tag: 'Thời khóa biểu',
    endpoint: '/api.php?action=admin/bookings',
    dataKey: 'bookings',
    createLabel: 'Tạo lịch',
    columns: [
      { key: 'date', label: 'Ngày', format: (row) => formatDate(row.date) },
      { key: 'teacherName', label: 'Giảng viên' },
      { key: 'subjectName', label: 'Môn học' },
      { key: 'room', label: 'Phòng' },
      { key: 'startTime', label: 'Bắt đầu' },
      { key: 'endTime', label: 'Kết thúc' },
      { key: 'practiceTopic', label: 'Ghi chú nhanh' },
    ],
    fields: [
      { name: 'teacherId', label: 'Giảng viên', type: 'select', required: true, options: () => state.teachers.filter((teacher) => !teacher.isAdmin).map((teacher) => ({ value: teacher.id, label: teacher.fullName })) },
      { name: 'subjectCode', label: 'Mã môn', type: 'select', required: true, options: () => state.subjects.map((subject) => ({ value: subject.code, label: `${subject.code} - ${subject.name}` })) },
      { name: 'subjectName', label: 'Tên môn', required: true },
      { name: 'classGroup', label: 'Nhóm thực hành', required: true },
      { name: 'room', label: 'Phòng', type: 'select', required: true, options: () => state.rooms.map((room) => ({ value: room.name, label: `${room.name} (${room.capacity})` })) },
      { name: 'date', label: 'Ngày', type: 'date', required: true },
      { name: 'startTime', label: 'Giờ bắt đầu', type: 'time', required: true },
      { name: 'endTime', label: 'Giờ kết thúc', type: 'time', required: true },
      { name: 'practiceTopic', label: 'Nội dung thực hành', className: 'full', required: true },
      { name: 'note', label: 'Ghi chú', type: 'textarea', className: 'full' },
    ],
  },
  rooms: {
    title: 'Quản lý phòng học',
    tag: 'Tài nguyên lab',
    endpoint: '/api.php?action=admin/rooms',
    dataKey: 'rooms',
    createLabel: 'Thêm phòng',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Phòng' },
      { key: 'capacity', label: 'Sức chứa' },
      { key: 'status', label: 'Trạng thái', format: (row) => statusLabel(row.status) },
    ],
    fields: [
      { name: 'name', label: 'Tên phòng', required: true },
      { name: 'capacity', label: 'Sức chứa', type: 'number', required: true },
      { name: 'status', label: 'Trạng thái', type: 'select', options: () => [{ value: 'available', label: 'Sẵn sàng' }, { value: 'maintenance', label: 'Bảo trì' }, { value: 'inactive', label: 'Tạm dừng' }] },
    ],
  },
  subjects: {
    title: 'Quản lý môn học',
    tag: 'Học phần',
    endpoint: '/api.php?action=admin/subjects',
    dataKey: 'subjects',
    createLabel: 'Thêm môn',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'code', label: 'Mã môn' },
      { key: 'name', label: 'Tên môn' },
    ],
    fields: [
      { name: 'code', label: 'Mã môn', required: true },
      { name: 'name', label: 'Tên môn', required: true },
    ],
  },
  students: {
    title: 'Quản lý sinh viên',
    tag: 'Danh sách lớp',
    endpoint: '/api.php?action=admin/students',
    dataKey: 'students',
    createLabel: 'Thêm sinh viên',
    columns: [
      { key: 'studentCode', label: 'Mã SV' },
      { key: 'fullName', label: 'Tên sinh viên' },
      { key: 'email', label: 'Email' },
      { key: 'className', label: 'Lớp' },
      { key: 'status', label: 'Trạng thái', format: (row) => statusLabel(row.status) },
    ],
    fields: [
      { name: 'studentCode', label: 'Mã sinh viên', required: true },
      { name: 'fullName', label: 'Tên sinh viên', required: true },
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'className', label: 'Lớp', required: true },
      { name: 'status', label: 'Trạng thái', type: 'select', options: () => [{ value: 'active', label: 'Đang học' }, { value: 'inactive', label: 'Tạm dừng' }] },
    ],
  },
};

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatDate(dateString) {
  if (!dateString) {
    return '';
  }

  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
}

function toDateInput(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function addDays(dateString, amount) {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + amount);
  return toDateInput(date);
}

function getMonday(date = new Date()) {
  const current = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = current.getDay();
  current.setDate(current.getDate() + (day === 0 ? -6 : 1 - day));
  return toDateInput(current);
}

function statusLabel(status) {
  const labels = {
    available: 'Sẵn sàng',
    maintenance: 'Bảo trì',
    inactive: 'Tạm dừng',
    active: 'Đang hoạt động',
  };

  const className = ['maintenance', 'inactive'].includes(status) ? 'status-pill warning' : 'status-pill';
  return `<span class="${className}">${labels[status] || status || 'Không rõ'}</span>`;
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

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  toastStack.append(toast);
  window.setTimeout(() => toast.remove(), 3200);
}

function showLogin(message = '') {
  loginScreen.classList.remove('hidden');
  shell.classList.add('hidden');
  loginMessage.textContent = message;
}

function showShell() {
  loginScreen.classList.add('hidden');
  shell.classList.remove('hidden');
}

function renderProfile() {
  adminName.textContent = state.currentAdmin.fullName;
  adminEmail.textContent = state.currentAdmin.email;
  adminAvatar.textContent = state.currentAdmin.fullName
    .split(' ')
    .slice(-2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

async function loadMeta() {
  const meta = await requestJson('/api.php?action=admin/meta');
  state.currentAdmin = meta.currentAdmin;
  state.teachers = meta.teachers;
  state.rooms = meta.rooms;
  state.roomNames = meta.roomNames;
  state.subjects = meta.subjects;
  state.students = meta.students;
  renderProfile();
  renderFilterOptions();
}

async function loadDashboard() {
  state.dashboard = await requestJson('/api.php?action=admin/dashboard');
  renderDashboard();
}

async function loadBookings() {
  const params = new URLSearchParams();
  if (state.bookingFilters.date) {
    params.set('date', state.bookingFilters.date);
  }
  if (state.bookingFilters.teacherId) {
    params.set('teacherId', state.bookingFilters.teacherId);
  }
  if (state.bookingFilters.room) {
    params.set('room', state.bookingFilters.room);
  }

  const suffix = params.toString() ? `&${params.toString()}` : '';
  state.bookings = await requestJson(`/api.php?action=admin/bookings${suffix}`);
}

async function refreshModuleData() {
  if (state.currentModule === 'bookings') {
    await loadBookings();
  } else {
    const config = moduleConfigs[state.currentModule];
    state[config.dataKey] = await requestJson(config.endpoint);
  }
}

async function refreshAll() {
  await loadMeta();
  await loadDashboard();
  if (moduleConfigs[state.currentModule]) {
    await refreshModuleData();
    renderModule();
  }
}

function renderDashboard() {
  const totals = state.dashboard.totals;
  const cards = [
    ['Tổng giảng viên', totals.teachers, 'Nhân sự đang giảng dạy'],
    ['Tổng lịch thực hành', totals.bookings, 'Tất cả lịch đã tạo'],
    ['Lịch hôm nay', totals.todayBookings, 'Theo ngày hiện tại'],
    ['Phòng đang sử dụng', totals.roomsInUse, 'Phòng có lịch hôm nay'],
  ];

  statsGrid.innerHTML = cards.map(([label, value, hint]) => `
    <article class="stat-card">
      <p>${label}</p>
      <strong>${value}</strong>
      <span>${hint}</span>
    </article>
  `).join('');

  renderBarChart(scheduleChart, state.dashboard.schedulesByDay, 'date', 'total', true);
  renderBarChart(roomChart, state.dashboard.roomUsage, 'room', 'total');

  recentBookings.innerHTML = state.dashboard.recentBookings.map((booking) => `
    <tr>
      <td>${formatDate(booking.date)}</td>
      <td>${escapeHtml(booking.teacherName)}</td>
      <td>${escapeHtml(booking.subjectCode)} - ${escapeHtml(booking.subjectName)}</td>
      <td>${escapeHtml(booking.room)}</td>
      <td>${escapeHtml(booking.startTime)} - ${escapeHtml(booking.endTime)}</td>
    </tr>
  `).join('') || '<tr><td colspan="5">Chưa có lịch thực hành.</td></tr>';

  renderReports();
}

function renderBarChart(container, rows, labelKey, valueKey, formatDateLabel = false) {
  const max = Math.max(1, ...rows.map((row) => Number(row[valueKey])));
  container.innerHTML = rows.map((row) => {
    const value = Number(row[valueKey]);
    const width = Math.max(5, Math.round((value / max) * 100));
    const label = formatDateLabel ? formatDate(row[labelKey]) : row[labelKey];
    return `
      <div class="bar-row">
        <span>${escapeHtml(label)}</span>
        <div class="bar-track"><div class="bar-fill" style="width: ${width}%"></div></div>
        <strong>${value}</strong>
      </div>
    `;
  }).join('') || '<p class="message-box">Chưa có dữ liệu thống kê.</p>';
}

function renderReports() {
  if (!state.dashboard) {
    return;
  }

  const totals = state.dashboard.totals;
  const busiestRoom = state.dashboard.roomUsage[0]?.room || 'Chưa có';
  reportGrid.innerHTML = `
    <article class="stat-card">
      <p>Phòng được dùng nhiều nhất</p>
      <strong>${escapeHtml(busiestRoom)}</strong>
      <span>Dữ liệu từ tất cả lịch thực hành</span>
    </article>
    <article class="stat-card">
      <p>Quy mô dữ liệu</p>
      <strong>${totals.rooms + totals.subjects + totals.students}</strong>
      <span>Phòng, môn học và sinh viên đang quản lý</span>
    </article>
  `;
}

function renderFilterOptions() {
  filterTeacher.innerHTML = '<option value="">Tất cả</option>' + state.teachers
    .filter((teacher) => !teacher.isAdmin)
    .map((teacher) => `<option value="${teacher.id}">${escapeHtml(teacher.fullName)}</option>`)
    .join('');

  filterRoom.innerHTML = '<option value="">Tất cả</option>' + state.rooms
    .map((room) => `<option value="${escapeHtml(room.name)}">${escapeHtml(room.name)}</option>`)
    .join('');

  filterDate.value = state.bookingFilters.date;
  filterTeacher.value = state.bookingFilters.teacherId;
  filterRoom.value = state.bookingFilters.room;
}

function setActiveView(view) {
  document.querySelectorAll('.menu-item').forEach((item) => {
    item.classList.toggle('active', item.dataset.view === view);
  });

  dashboardView.classList.toggle('active', view === 'dashboard');
  moduleView.classList.toggle('active', Boolean(moduleConfigs[view]));
  reportsView.classList.toggle('active', view === 'reports');
  pageTitle.textContent = view === 'reports' ? 'Thống kê / báo cáo' : (moduleConfigs[view]?.title || 'Tổng quan');
}

async function switchView(view) {
  state.currentModule = view;
  state.page = 1;
  setActiveView(view);

  if (view === 'dashboard') {
    await loadDashboard();
    return;
  }

  if (view === 'reports') {
    await loadDashboard();
    renderReports();
    return;
  }

  await refreshModuleData();
  renderModule();
}

function getRowsForCurrentModule() {
  const config = moduleConfigs[state.currentModule];
  const allRows = [...state[config.dataKey]];

  if (!state.sortKey) {
    return allRows;
  }

  return allRows.sort((a, b) => {
    const left = String(a[state.sortKey] ?? '').toLowerCase();
    const right = String(b[state.sortKey] ?? '').toLowerCase();
    return state.sortDirection === 'asc' ? left.localeCompare(right) : right.localeCompare(left);
  });
}

function renderModule() {
  const config = moduleConfigs[state.currentModule];
  const rows = getRowsForCurrentModule();
  const totalPages = Math.max(1, Math.ceil(rows.length / state.pageSize));
  state.page = Math.min(state.page, totalPages);
  const start = (state.page - 1) * state.pageSize;
  const pageRows = rows.slice(start, start + state.pageSize);

  moduleTag.textContent = config.tag;
  moduleTitle.textContent = config.title;
  addButton.textContent = config.createLabel;
  scheduleFilters.classList.toggle('hidden', state.currentModule !== 'bookings');
  calendarPanel.classList.toggle('hidden', state.currentModule !== 'bookings');

  tableHead.innerHTML = `
    <tr>
      ${config.columns.map((column) => `
        <th>
          <button class="text-button" data-sort-key="${column.key}" type="button">
            ${column.label}${state.sortKey === column.key ? (state.sortDirection === 'asc' ? ' ↑' : ' ↓') : ''}
          </button>
        </th>
      `).join('')}
      <th>Thao tac</th>
    </tr>
  `;

  tableBody.innerHTML = pageRows.map((row) => `
    <tr>
      ${config.columns.map((column) => {
        const value = column.format ? column.format(row) : escapeHtml(row[column.key]);
        return `<td>${value}</td>`;
      }).join('')}
      <td>
        <div class="row-actions">
          <button class="text-button" data-action="edit" data-id="${row.id}" type="button">Sửa</button>
          <button class="danger-button" data-action="delete" data-id="${row.id}" type="button">Xóa</button>
        </div>
      </td>
    </tr>
  `).join('') || `<tr><td colspan="${config.columns.length + 1}">Không có dữ liệu phù hợp.</td></tr>`;

  pageInfo.textContent = `${rows.length} bản ghi | Trang ${state.page}/${totalPages}`;
  prevPage.disabled = state.page <= 1;
  nextPage.disabled = state.page >= totalPages;

  if (state.currentModule === 'bookings') {
    renderCalendar(rows);
  }
}

function renderCalendar(rows) {
  const monday = getMonday();
  calendarBoard.innerHTML = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(monday, index);
    const dayRows = rows.filter((booking) => booking.date === date);
    return `
      <div class="calendar-day" data-date="${date}">
        <h4>${formatDate(date)}</h4>
        ${dayRows.map((booking) => `
          <article class="calendar-card" draggable="true" data-booking-id="${booking.id}">
            <strong>${escapeHtml(booking.subjectCode)} - ${escapeHtml(booking.room)}</strong>
            <span>${escapeHtml(booking.startTime)} - ${escapeHtml(booking.endTime)}</span>
          </article>
        `).join('')}
      </div>
    `;
  }).join('');
}

function openModal(row = null) {
  const config = moduleConfigs[state.currentModule];
  state.editingId = row?.id || null;
  modalTag.textContent = config.tag;
  modalTitle.textContent = row ? `Sửa ${config.title.toLowerCase()}` : config.createLabel;
  modalFields.innerHTML = config.fields.map((field) => renderField(field, row)).join('');

  const subjectSelect = modalFields.querySelector('[name="subjectCode"]');
  const subjectNameInput = modalFields.querySelector('[name="subjectName"]');
  if (subjectSelect && subjectNameInput) {
    subjectSelect.addEventListener('change', () => {
      const subject = state.subjects.find((item) => item.code === subjectSelect.value);
      if (subject) {
        subjectNameInput.value = subject.name;
      }
    });
  }

  formDialog.showModal();
}

function renderField(field, row) {
  const value = row?.[field.name] ?? '';
  const labelClass = field.className || '';
  const required = field.required ? 'required' : '';

  if (field.type === 'select') {
    const options = field.options().map((option) => `
      <option value="${escapeHtml(option.value)}" ${String(option.value) === String(value) ? 'selected' : ''}>
        ${escapeHtml(option.label)}
      </option>
    `).join('');
    return `
      <label class="${labelClass}">
        ${field.label}
        <select name="${field.name}" ${required}>
          <option value="">Chọn...</option>
          ${options}
        </select>
      </label>
    `;
  }

  if (field.type === 'textarea') {
    return `
      <label class="${labelClass}">
        ${field.label}
        <textarea name="${field.name}" rows="4" ${required}>${escapeHtml(value)}</textarea>
      </label>
    `;
  }

  if (field.type === 'checkbox') {
    return `
      <label class="${labelClass}">
        ${field.label}
        <select name="${field.name}">
          <option value="false" ${!value ? 'selected' : ''}>Không</option>
          <option value="true" ${value ? 'selected' : ''}>Có</option>
        </select>
      </label>
    `;
  }

  return `
    <label class="${labelClass}">
      ${field.label}
      <input name="${field.name}" type="${field.type || 'text'}" value="${escapeHtml(value)}" placeholder="${escapeHtml(field.placeholder || '')}" ${required} />
    </label>
  `;
}

function buildPayloadFromForm() {
  const config = moduleConfigs[state.currentModule];
  const formData = new FormData(entityForm);
  const payload = Object.fromEntries(formData.entries());

  for (const field of config.fields) {
    if (field.type === 'number') {
      payload[field.name] = Number(payload[field.name]);
    }
    if (field.type === 'checkbox') {
      payload[field.name] = payload[field.name] === 'true';
    }
  }

  if (!payload.password) {
    delete payload.password;
  }

  return payload;
}

async function handleEntitySubmit(event) {
  event.preventDefault();
  const config = moduleConfigs[state.currentModule];
  const payload = buildPayloadFromForm();
  const url = state.editingId ? `${config.endpoint}&id=${state.editingId}` : config.endpoint;
  const method = state.editingId ? 'PUT' : 'POST';

  try {
    await requestJson(url, {
      method,
      body: JSON.stringify(payload),
    });

    formDialog.close();
    showToast(state.editingId ? 'Đã cập nhật dữ liệu.' : 'Đã thêm dữ liệu mới.');
    await refreshAll();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function deleteRow(id) {
  const config = moduleConfigs[state.currentModule];
  const confirmed = window.confirm('Bạn có chắc muốn xóa bản ghi này không?');
  if (!confirmed) {
    return;
  }

  try {
    await requestJson(`${config.endpoint}&id=${id}`, { method: 'DELETE' });
    showToast('Đã xóa bản ghi.');
    await refreshAll();
  } catch (error) {
    showToast(error.message, 'error');
  }
}


async function updateBookingDate(bookingId, date) {
  const booking = state.bookings.find((item) => Number(item.id) === Number(bookingId));
  if (!booking || booking.date === date) {
    return;
  }

  try {
    await requestJson(`/api.php?action=admin/bookings&id=${booking.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        teacherId: booking.teacherId,
        subjectCode: booking.subjectCode,
        subjectName: booking.subjectName,
        classGroup: booking.classGroup,
        room: booking.room,
        practiceTopic: booking.practiceTopic,
        date,
        startTime: booking.startTime,
        endTime: booking.endTime,
        note: booking.note || '',
      }),
    });
    showToast('Đã đổi ngày lịch thực hành.');
    await refreshAll();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function bootstrap() {
  const session = await requestJson('/api.php?action=session');
  if (!session.authenticated) {
    showLogin('');
    return;
  }

  if (!session.teacher?.isAdmin) {
    showLogin('Tài khoản hiện tại không có quyền admin.');
    return;
  }

  await loadMeta();
  await loadDashboard();
  await loadBookings();
  showShell();
  setActiveView('dashboard');
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  loginMessage.textContent = 'Đang xác thực...';
  const payload = Object.fromEntries(new FormData(loginForm).entries());

  try {
    const result = await requestJson('/api.php?action=auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!result.teacher?.isAdmin) {
      loginMessage.textContent = 'Tài khoản này không có quyền admin.';
      return;
    }

    loginMessage.textContent = '';
    await bootstrap();
  } catch (error) {
    loginMessage.textContent = error.message;
  }
});

logoutButton.addEventListener('click', async () => {
  await requestJson('/api.php?action=auth/logout', { method: 'POST' });
  showLogin('Bạn đã đăng xuất.');
});

themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark');
});

document.querySelectorAll('.menu-item').forEach((item) => {
  item.addEventListener('click', () => switchView(item.dataset.view).catch((error) => showToast(error.message, 'error')));
});

tableHead.addEventListener('click', (event) => {
  const button = event.target.closest('[data-sort-key]');
  if (!button) {
    return;
  }

  const key = button.dataset.sortKey;
  if (state.sortKey === key) {
    state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    state.sortKey = key;
    state.sortDirection = 'asc';
  }
  renderModule();
});

tableBody.addEventListener('click', (event) => {
  const button = event.target.closest('[data-action]');
  if (!button) {
    return;
  }

  const config = moduleConfigs[state.currentModule];
  const row = state[config.dataKey].find((item) => Number(item.id) === Number(button.dataset.id));
  if (button.dataset.action === 'edit') {
    openModal(row);
  }
  if (button.dataset.action === 'delete') {
    deleteRow(button.dataset.id);
  }
});

addButton.addEventListener('click', () => openModal());

entityForm.addEventListener('submit', handleEntitySubmit);
cancelModal.addEventListener('click', () => formDialog.close());
modalClose.addEventListener('click', () => formDialog.close());

prevPage.addEventListener('click', () => {
  state.page = Math.max(1, state.page - 1);
  renderModule();
});

nextPage.addEventListener('click', () => {
  state.page += 1;
  renderModule();
});

[filterDate, filterTeacher, filterRoom].forEach((control) => {
  control.addEventListener('change', async () => {
    state.bookingFilters = {
      date: filterDate.value,
      teacherId: filterTeacher.value,
      room: filterRoom.value,
    };
    state.page = 1;
    await loadBookings();
    renderModule();
  });
});

clearFilters.addEventListener('click', async () => {
  state.bookingFilters = { date: '', teacherId: '', room: '' };
  renderFilterOptions();
  await loadBookings();
  renderModule();
});

calendarBoard.addEventListener('dragstart', (event) => {
  const card = event.target.closest('[data-booking-id]');
  if (card) {
    event.dataTransfer.setData('text/plain', card.dataset.bookingId);
  }
});

calendarBoard.addEventListener('dragover', (event) => {
  if (event.target.closest('[data-date]')) {
    event.preventDefault();
  }
});

calendarBoard.addEventListener('drop', (event) => {
  const day = event.target.closest('[data-date]');
  const bookingId = event.dataTransfer.getData('text/plain');
  if (day && bookingId) {
    updateBookingDate(bookingId, day.dataset.date);
  }
});

bootstrap().catch((error) => {
  if (error.statusCode === 401 || error.statusCode === 403) {
    showLogin(error.message);
    return;
  }
  showToast(error.message, 'error');
});
