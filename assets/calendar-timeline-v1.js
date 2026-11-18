(function (root) {
  'use strict';
  const DAY = 86400000;
  const weekdays = '일월화수목금토';
  let lastSignature = '', initialized = false;

  function parseDay(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return NaN;
    const time = Date.parse(value + 'T00:00:00Z');
    return Number.isFinite(time) && dayKey(time) === value ? time : NaN;
  }

  function dayKey(time) { return new Date(time).toISOString().slice(0, 10); }

  function buildDays(events, today) {
    const now = parseDay(today);
    if (!Number.isFinite(now)) return [];
    const gamesByDate = new Map();
    let first = now - 90 * DAY, last = now + 30 * DAY;
    for (const event of Array.isArray(events) ? events : []) {
      const time = parseDay(event?.date);
      if (!Number.isFinite(time)) continue;
      first = Math.min(first, time);
      last = Math.max(last, time);
      const name = typeof event?.steamGame?.name === 'string' ? event.steamGame.name.trim() : '';
      if (!name || event.restDay) continue;
      if (!gamesByDate.has(time)) gamesByDate.set(time, new Map());
      const names = gamesByDate.get(time);
      const key = name.normalize('NFC').toLocaleLowerCase('ko-KR');
      if (!names.has(key)) names.set(key, name);
    }
    const days = [];
    for (let time = first; time <= last; time += DAY) {
      const date = new Date(time);
      days.push({date: dayKey(time), year: date.getUTCFullYear(), month: date.getUTCMonth() + 1,
        day: date.getUTCDate(), weekday: date.getUTCDay(), today: time === now,
        games: [...(gamesByDate.get(time)?.values() || [])]});
    }
    return days;
  }

  function jumpToday(panel) {
    const today = panel.querySelector('.calendar-timeline-day-v1.is-today');
    if (!today) return;
    const list = panel.querySelector('#calendarTimelineDaysV1');
    if (list.classList.contains('is-single-line')) {
      list.scrollLeft += today.getBoundingClientRect().left - list.getBoundingClientRect().left - list.clientWidth / 2 + today.clientWidth / 2;
    } else {
      list.scrollTop += today.getBoundingClientRect().top - list.getBoundingClientRect().top - list.clientHeight / 2 + today.clientHeight / 2;
    }
  }

  function render(events, today) {
    const panel = root.document?.getElementById('calendarTimelinePanelV1');
    if (!panel || panel.hidden) return;
    const list = panel.querySelector('#calendarTimelineDaysV1');
    if (!list) return;
    if (!initialized) {
      panel.querySelector('#calendarTimelineTodayV1')?.addEventListener('click', () => jumpToday(panel));
      for (const button of panel.querySelectorAll('[data-timeline-layout]')) {
        button.addEventListener('click', () => {
          const current = list.querySelector('.is-today');
          const visible = current && current.getBoundingClientRect().top >= list.getBoundingClientRect().top && current.getBoundingClientRect().bottom <= list.getBoundingClientRect().bottom && current.getBoundingClientRect().left >= list.getBoundingClientRect().left && current.getBoundingClientRect().right <= list.getBoundingClientRect().right;
          list.classList.toggle('is-single-line', button.dataset.timelineLayout === 'line');
          for (const other of panel.querySelectorAll('[data-timeline-layout]')) {
            other.classList.toggle('active', other === button);
            other.setAttribute('aria-pressed', String(other === button));
          }
          if (visible) jumpToday(panel);
        });
      }
      initialized = true;
    }
    const days = buildDays(events, today);
    const signature = JSON.stringify(days.map(day => [day.date, day.today, day.games]));
    if (signature === lastSignature) return;
    const initial = !lastSignature;
    lastSignature = signature;
    const fragment = root.document.createDocumentFragment();
    for (const day of days) {
      const cell = root.document.createElement('article');
      cell.className = 'calendar-timeline-day-v1';
      cell.dataset.date = day.date;
      if (day.today) cell.classList.add('is-today');
      if (day.day === 1) cell.classList.add('is-month-start');
      if (day.weekday === 0) cell.classList.add('is-sunday');
      if (day.weekday === 6) cell.classList.add('is-saturday');
      const date = root.document.createElement('time');
      date.dateTime = day.date;
      date.className = 'calendar-timeline-date-v1';
      date.textContent = `${day.day === 1 ? day.year + '.' : ''}${day.month}.${day.day} ${weekdays[day.weekday]}`;
      date.title = day.date;
      cell.append(date);
      for (const name of day.games) {
        const game = root.document.createElement('div');
        game.className = 'calendar-timeline-game-v1';
        game.textContent = name;
        game.title = name;
        cell.append(game);
      }
      fragment.append(cell);
    }
    list.replaceChildren(fragment);
    const summary = panel.querySelector('#calendarTimelineRangeV1');
    if (summary && days.length) summary.textContent = `${days[0].date} ~ ${days[days.length - 1].date} · ${days.length}일`;
    if (initial) jumpToday(panel);
  }

  root.mwsCalendarTimelineV1 = {buildDays, render};
})(globalThis);
