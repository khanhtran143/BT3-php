const DAY_NAMES = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
const HOURS = Array.from({ length: 11 }, (_, index) => 7 + index);

const printTitle = document.querySelector('#print-title');
const printSubtitle = document.querySelector('#print-subtitle');
const summaryStrip = document.querySelector('#summary-strip');
const printGrid = document.querySelector('#print-grid');
const printList = document.querySelector('#print-list');
const printNote = document.querySelector('#print-note');

function queryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function addDays(dateString, amount) {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + amount);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatDateLabel(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function getDayIndex(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return (date.getDay() + 6) % 7;
}

function requestJson(url) {
  return fetch(url).then(async (response) => {
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || 'Không thể tải dữ liệu in.');
    }
    return payload;
  });
}

function renderSummary(summary, teacherName) {
  const cards = [
    { label: 'Tổng lịch trong tuần', value: summary.totalBookings },
    { label: 'Giảng viên trong bộ lọc', value: summary.totalTeachers },
    { label: 'Phòng máy sử dụng', value: summary.totalRooms },
  ];

  summaryStrip.innerHTML = cards
    .map(
      (card) => `
        <article class="summary-card">
          <p>${card.label}</p>
          <strong>${card.value}</strong>
        </article>
      `,
    )
    .join('');

  if (teacherName) {
    printSubtitle.textContent = `${printSubtitle.textContent} | Bộ lọc: ${teacherName}`;
  }
}

function renderGrid(weekStart, bookings) {
  const headers = DAY_NAMES.map((dayName, index) => {
    const date = addDays(weekStart, index);
    return `<th>${dayName}<br /><small>${formatDateLabel(date)}</small></th>`;
  }).join('');

  const rows = HOURS.map((hour) => {
    const rowCells = DAY_NAMES.map((_, dayIndex) => {
      const cellBookings = bookings.filter((booking) => {
        const bookingHour = Number(booking.startTime.slice(0, 2));
        return getDayIndex(booking.date) === dayIndex && bookingHour === hour;
      });

      if (!cellBookings.length) {
        return '<td></td>';
      }

      return `
        <td>
          <div class="cell-stack">
            ${cellBookings
              .map(
                (booking) => `
                  <article class="mini-booking">
                    <h3>${escapeHtml(booking.subjectName)} (${escapeHtml(booking.subjectCode)})</h3>
                    <p>${escapeHtml(booking.teacherName)} | ${escapeHtml(booking.classGroup)}</p>
                    <p>${escapeHtml(booking.startTime)} - ${escapeHtml(booking.endTime)} | ${escapeHtml(booking.room)}</p>
                    <p>${escapeHtml(booking.practiceTopic)}</p>
                  </article>
                `,
              )
              .join('')}
          </div>
        </td>
      `;
    }).join('');

    return `
      <tr>
        <td class="time-col">${String(hour).padStart(2, '0')}:00</td>
        ${rowCells}
      </tr>
    `;
  }).join('');

  printGrid.innerHTML = `
    <table class="schedule-table">
      <thead>
        <tr>
          <th class="time-col">Giờ</th>
          ${headers}
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
}

function renderList(bookings) {
  printList.innerHTML = `
    <h2>Danh sách chi tiết</h2>
    ${
      bookings.length
        ? bookings
            .map(
              (booking) => `
                <article class="print-list-item">
                  <h3>${escapeHtml(booking.subjectName)} - ${escapeHtml(booking.classGroup)}</h3>
                  <p>${escapeHtml(formatDateLabel(booking.date))} | ${escapeHtml(booking.startTime)} - ${escapeHtml(
                    booking.endTime,
                  )}</p>
                  <p>${escapeHtml(booking.teacherName)} | ${escapeHtml(booking.room)}</p>
                  <p>${escapeHtml(booking.practiceTopic)}${booking.note ? ` | ${escapeHtml(booking.note)}` : ''}</p>
                </article>
              `,
            )
            .join('')
        : '<p>Không có lịch nào trong bộ lọc hiện tại.</p>'
    }
  `;
}

async function bootstrap() {
  const weekStart = queryParam('weekStart');
  const teacherId = queryParam('teacherId');
  const mode = queryParam('mode');
  const autoPrint = queryParam('autoPrint') === '1';

  if (mode === 'pdf') {
    printNote.innerHTML = 'Hộp thoại in sẽ mở ra tự động. Hãy chọn <strong>Lưu thành PDF</strong> để xuất file PDF.';
  }

  const session = await requestJson('/api.php?action=session');
  if (!session.authenticated) {
    throw new Error('Bạn cần đăng nhập trước khi in lịch.');
  }

  const teacherFilter = teacherId ? `&teacherId=${teacherId}` : '';
  const schedule = await requestJson(`/api.php?action=schedule&weekStart=${weekStart}${teacherFilter}`);

  const teacherName =
    schedule.teachers.find((teacher) => String(teacher.id) === String(teacherId))?.fullName || '';

  printTitle.textContent = `Lịch thực hành tuần ${formatDateLabel(schedule.weekStart)} - ${formatDateLabel(
    schedule.weekEnd,
  )}`;
  printSubtitle.textContent = `Giảng viên đăng nhập: ${session.teacher.fullName}`;

  renderSummary(schedule.summary, teacherName);
  renderGrid(schedule.weekStart, schedule.bookings);
  renderList(schedule.bookings);

  if (autoPrint) {
    window.setTimeout(() => window.print(), 300);
  }
}

document.querySelector('#print-now').addEventListener('click', () => window.print());
document.querySelector('#close-window').addEventListener('click', () => window.close());

bootstrap().catch((error) => {
  printTitle.textContent = 'Không tải được lịch in';
  printSubtitle.textContent = error.message;
  summaryStrip.innerHTML = '';
  printGrid.innerHTML = '';
  printList.innerHTML = '';
});
