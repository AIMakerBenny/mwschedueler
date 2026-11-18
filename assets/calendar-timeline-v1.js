(function (root) {
  'use strict';
  const DAY = 86400000;
  const weekdays = '일월화수목금토';
  let lastSignature = '', initialized = false, resizeObserver, tooltip, tooltipOwner;

  function parseDay(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return NaN;
    const time = Date.parse(value + 'T00:00:00Z');
    return Number.isFinite(time) && dayKey(time) === value ? time : NaN;
  }

  function dayKey(time) { return new Date(time).toISOString().slice(0, 10); }

  function safeImage(value) {
    const url = typeof value === 'string' ? value.trim() : '';
    return /^https:\/\/[^\s<>"']+$/i.test(url) ||
      (url.length <= 95000 && /^data:image\/(?:webp|jpeg|png);base64,[a-z0-9+/=]+$/i.test(url)) ? url : '';
  }

  function gameIdentity(game) {
    return game?.source === 'manual' && game.id ? String(game.id) :
      /^\d{1,12}$/.test(String(game?.appid || '')) ? 'steam:' + game.appid : '';
  }

  function buildDays(events, today, groups = [], library = []) {
    const now = parseDay(today);
    if (!Number.isFinite(now)) return [];
    const gamesByDate = new Map();
    const libraryById = new Map((Array.isArray(library) ? library : []).map(game => [gameIdentity(game), game]).filter(([id]) => id));
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
      const identity = gameIdentity(event.steamGame);
      const registered = libraryById.get(identity);
      const image = safeImage(event.steamGame.image || event.steamGame.headerImage) ||
        safeImage(registered?.image || registered?.headerImage) ||
        (identity.startsWith('steam:') ? 'https://cdn.cloudflare.steamstatic.com/steam/apps/' + event.steamGame.appid + '/header.jpg' : '');
      const previous = names.get(key);
      if (!previous || (!previous.image && image)) names.set(key, {name: previous?.name || name, image});
    }
    // Use the exact same explicit contentGroupId streaks as the monthly calendar.
    const bandsByDate = new Map(), laneEnds = [];
    const streaks = root.mwsCalendarContinuousSeriesV1?.streaks(events, groups) || [];
    for (const streak of streaks) {
      let lane = laneEnds.findIndex(end => end < streak.start);
      if (lane < 0) lane = laneEnds.length;
      laneEnds[lane] = streak.end;
      for (const date of streak.dates) {
        if (!bandsByDate.has(date)) bandsByDate.set(date, []);
        bandsByDate.get(date).push({id: streak.key, name: streak.title, color: streak.color, lane,
          before: date !== streak.start, after: date !== streak.end});
      }
    }
    const days = [];
    for (let time = first; time <= last; time += DAY) {
      const date = new Date(time);
      const key = dayKey(time), icons = [...(gamesByDate.get(time)?.values() || [])];
      days.push({date: key, year: date.getUTCFullYear(), month: date.getUTCMonth() + 1,
        day: date.getUTCDate(), weekday: date.getUTCDay(), today: time === now,
        games: icons.map(icon => icon.name), icons, bands: bandsByDate.get(key) || []});
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

  function markRowEdges(list) {
    const cells = [...list.children];
    if (!cells.length || !list.clientWidth) return;
    const tops = cells.map(cell => cell.offsetTop);
    for (let i = 0; i < cells.length; i++) {
      cells[i].classList.toggle('is-row-start', i === 0 || tops[i] !== tops[i-1]);
      cells[i].classList.toggle('is-row-end', i === cells.length-1 || tops[i] !== tops[i+1]);
    }
  }

  function hideTooltip() {
    if (tooltip) tooltip.hidden = true;
    if (tooltipOwner) tooltipOwner.removeAttribute('aria-describedby');
    tooltipOwner = null;
  }

  function showTooltip(icon, name) {
    if (!tooltip) {
      tooltip = root.document.createElement('div');
      tooltip.className = 'calendar-timeline-tooltip-v1';
      tooltip.id = 'calendarTimelineGameTooltipV1';
      tooltip.setAttribute('role','tooltip');
      root.document.body.append(tooltip);
    }
    hideTooltip();
    tooltipOwner = icon;
    tooltip.textContent = name;
    icon.setAttribute('aria-describedby', tooltip.id);
    tooltip.hidden = false;
    tooltip.style.left = '0px';
    tooltip.style.top = '0px';
    const rect = icon.getBoundingClientRect();
    const box = tooltip.getBoundingClientRect();
    const scale = tooltip.offsetWidth ? box.width / tooltip.offsetWidth : 1;
    const width = root.document.documentElement.clientWidth;
    const height = root.document.documentElement.clientHeight;
    const x = Math.max(8, Math.min(rect.left + (rect.width - box.width) / 2, width - box.width - 8));
    const above = rect.top - box.height - 7;
    const y = above >= 8 ? above : Math.max(8, Math.min(rect.bottom + 7, height - box.height - 8));
    tooltip.style.left = (x - box.left) / (scale || 1) + 'px';
    tooltip.style.top = (y - box.top) / (scale || 1) + 'px';
  }

  // Presentation-only projection. Keep every session, even without a linked game,
  // and never edit source events, participant IDs or explicit group links.
  function buildEntries(events, groups = [], contacts = []) {
    const people = new Map((Array.isArray(contacts) ? contacts : []).map(p => [p.id, p.name]));
    const groupMap = new Map((Array.isArray(groups) ? groups : []).map(g => [g.id, g]));
    const entries = new Map();
    for (const event of Array.isArray(events) ? events : []) {
      if (!Number.isFinite(parseDay(event?.date))) continue;
      const game = String(event.steamGame?.name || '').trim();
      const title = String(event.title || (event.restDay ? '휴방' : game) || '제목 없음').trim();
      const ids = [...new Set(Array.isArray(event.participants) ? event.participants : [])];
      const participants = ids.map(id => people.get(id)).filter(Boolean);
      const group = groupMap.get(event.contentGroupId);
      const color = /^#[\da-f]{3}(?:[\da-f]{3})?$/i.test(group?.color || '') ? group.color : '';
      const time = /^\d{2}:\d{2}$/.test(event.start || '') ? event.start : '';
      const end = /^\d{2}:\d{2}$/.test(event.end || '') ? event.end : '';
      const entry = {title, game, time, end, participants, participantCount: ids.length,
        group: String(group?.name || ''), color, rest: Boolean(event.restDay)};
      if (!entries.has(event.date)) entries.set(event.date, []);
      entries.get(event.date).push(entry);
    }
    for (const rows of entries.values()) rows.sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));
    return entries;
  }

  function render(events, today, groups = [], library = [], contacts = []) {
    const panel = root.document?.getElementById('calendarTimelinePanelV1');
    if (!panel || panel.hidden) return;
    const list = panel.querySelector('#calendarTimelineDaysV1');
    if (!list) return;
    if (!initialized) {
      panel.querySelector('#calendarTimelineTodayV1')?.addEventListener('click', () => jumpToday(panel));
      for (const button of panel.querySelectorAll('[data-timeline-layout]')) {
        button.addEventListener('click', () => {
          hideTooltip();
          const current = list.querySelector('.is-today');
          const visible = current && current.getBoundingClientRect().top >= list.getBoundingClientRect().top && current.getBoundingClientRect().bottom <= list.getBoundingClientRect().bottom && current.getBoundingClientRect().left >= list.getBoundingClientRect().left && current.getBoundingClientRect().right <= list.getBoundingClientRect().right;
          list.classList.toggle('is-single-line', button.dataset.timelineLayout === 'line');
          markRowEdges(list);
          for (const other of panel.querySelectorAll('[data-timeline-layout]')) {
            other.classList.toggle('active', other === button);
            other.setAttribute('aria-pressed', String(other === button));
          }
          if (visible) jumpToday(panel);
        });
      }
      root.addEventListener('scroll', hideTooltip, true);
      root.addEventListener('resize', hideTooltip);
      root.addEventListener('blur', hideTooltip);
      if (typeof root.ResizeObserver === 'function') {
        resizeObserver = new root.ResizeObserver(() => markRowEdges(list));
        resizeObserver.observe(list);
      }
      initialized = true;
    }
    const days = buildDays(events, today, groups, library);
    const entries = buildEntries(events, groups, contacts);
    const signature = JSON.stringify([days, [...entries]]);
    if (signature === lastSignature) { markRowEdges(list); return; }
    const initial = !lastSignature;
    lastSignature = signature;
    hideTooltip();
    const fragment = root.document.createDocumentFragment();
    for (const day of days) {
      const cell = root.document.createElement('article');
      cell.className = 'calendar-timeline-day-v1';
      cell.dataset.date = day.date;
      if (!entries.get(day.date)?.length) cell.classList.add('is-empty');
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
      if (day.bands.length) {
        const bands = root.document.createElement('div');
        bands.className = 'calendar-timeline-bands-v1';
        for (const band of day.bands) {
          const bar = root.document.createElement('div');
          bar.className = 'calendar-timeline-band-v1';
          bar.dataset.groupId = band.id;
          bar.title = band.name;
          bar.style.setProperty('--series-color', band.color);
          bar.style.gridRow = String(band.lane + 1);
          if (band.before) bar.classList.add('continues-before');
          if (band.after) bar.classList.add('continues-after');
          bands.append(bar);
        }
        cell.append(bands);
      }
      const icons = root.document.createElement('div');
      icons.className = 'calendar-timeline-icons-v1';
      const rows = entries.get(day.date) || [];
      for (const entry of rows) {
        const name = entry.game || entry.title;
        const image = day.icons.find(icon => icon.name.toLocaleLowerCase('ko-KR') === entry.game.toLocaleLowerCase('ko-KR'))?.image;
        const game = root.document.createElement('div');
        game.className = 'calendar-timeline-game-v1';
        if (entry.group) game.classList.add('has-group');
        if (entry.color) game.style.setProperty('--entry-color', entry.color);
        game.dataset.gameName = name;
        const timing = entry.time ? entry.time + (entry.end ? ' - ' + entry.end : '') : (entry.rest ? '휴방' : '시간 미정');
        const details = [day.date, entry.title, timing, entry.game, entry.group ? '연속 콘텐츠: ' + entry.group : '',
          entry.participantCount ? '참가자 ' + entry.participantCount + '명' + (entry.participants.length ? ': ' + entry.participants.join(', ') : '') : ''].filter(Boolean).join('\n');
        game.setAttribute('aria-label', details);
        game.setAttribute('role', 'group');
        game.tabIndex = 0;
        game.addEventListener('pointerenter', () => showTooltip(game, details));
        game.addEventListener('pointerleave', hideTooltip);
        game.addEventListener('focus', () => showTooltip(game, details));
        game.addEventListener('blur', hideTooltip);
        const fallback = root.document.createElement('span');
        fallback.className = 'calendar-timeline-cover-v2';
        fallback.textContent = Array.from(name)[0] || '?';
        fallback.setAttribute('aria-hidden', 'true');
        game.append(fallback);
        if (image) {
          const img = root.document.createElement('img');
          img.alt = '';
          img.loading = 'lazy';
          img.decoding = 'async';
          img.addEventListener('error', () => img.remove(), {once:true});
          img.src = image;
          fallback.append(img);
        }
        const copy = root.document.createElement('span');
        copy.className = 'calendar-timeline-copy-v2';
        const title = root.document.createElement('span');
        title.className = 'calendar-timeline-title-v2';
        title.textContent = entry.title;
        const meta = root.document.createElement('span');
        meta.className = 'calendar-timeline-meta-v2';
        meta.textContent = timing + (entry.participantCount ? ' · ' + entry.participantCount + '명' : '') + (entry.group ? ' · ' + entry.group : '');
        copy.append(title, meta);
        game.append(copy);
        icons.append(game);
      }
      cell.append(icons);
      fragment.append(cell);
    }
    list.replaceChildren(fragment);
    markRowEdges(list);
    const summary = panel.querySelector('#calendarTimelineRangeV1');
    if (summary && days.length) summary.textContent = `${days[0].date} ~ ${days[days.length - 1].date} · ${days.length}일`;
    if (initial) jumpToday(panel);
  }

  root.mwsCalendarTimelineV1 = {buildDays, buildEntries, render, hideTooltip};
})(globalThis);
