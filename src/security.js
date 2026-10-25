import { PREFIX } from './api.js';

export const CANARY_KEY = `${PREFIX}canary`;
const allowedTopics = new Set(['html', 'javascript', 'api']);
let refreshTimes = [];

export function reportIncident(type, reason) {
  const list = document.querySelector('#incident-list');
  const item = document.createElement('li');
  item.textContent = `${type}: ${reason}`;
  list.prepend(item);
  document.querySelector('#incidents-empty').hidden = true;
  document.querySelector('#incident-count').textContent = String(list.children.length);
}

export function checkActivity(action, details = {}) {
  if (action === 'refresh') {
    const now = Date.now();
    refreshTimes = refreshTimes.filter(time => now - time < 5000);
    refreshTimes.push(now);
    if (refreshTimes.length === 6) {
      reportIncident('T1', 'Шесть попыток обновления списка за последние 5 секунд.');
    }
  }

  if (action === 'submit') {
    if (details.supportCode) {
      reportIncident('T2', 'Заполнено скрытое служебное поле.');
    }
    if (details.topic && !allowedTopics.has(details.topic)) {
      reportIncident('T4', 'Передано направление, отсутствующее в списке.');
    }
  }

  if (action === 'decoy') {
    reportIncident('T3', 'Вызвана скрытая кнопка служебной выгрузки.');
  }

  if (action === 'startup') {
    let canary;
    try {
      canary = JSON.parse(localStorage.getItem(CANARY_KEY));
    } catch {}
    if (canary?.role === 'admin') {
      reportIncident('T5', 'Изменена роль учебного маркера.');
      try {
        localStorage.setItem(CANARY_KEY, JSON.stringify({ role: 'visitor' }));
      } catch {}
    }

    const url = new URL(window.location.href);
    if (url.searchParams.getAll('staff').includes('1')) {
      reportIncident('T6', 'Обнаружен служебный параметр staff=1.');
      url.searchParams.delete('staff');
      try {
        window.history.replaceState(window.history.state, '', url.href);
      } catch {}
    }
  }
}


export function isRestricted() {
  return false;
}

export function initializeSecurity() {
  try {
    if (localStorage.getItem(CANARY_KEY) === null) {
      localStorage.setItem(CANARY_KEY, JSON.stringify({ role: 'visitor' }));
    }
  } catch {}
  checkActivity('startup');
}

export function resetSecurity() {
  refreshTimes = [];
  try {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith(PREFIX) && key !== `${PREFIX}applications`) localStorage.removeItem(key);
    }
    localStorage.setItem(CANARY_KEY, JSON.stringify({ role: 'visitor' }));
  } catch {}
  document.querySelector('#incident-list').replaceChildren();
  document.querySelector('#incident-count').textContent = '0';
  document.querySelector('#incidents-empty').hidden = false;
  document.querySelector('#security-status').textContent = 'Ограничений нет';
  document.querySelector('#restriction-detail').hidden = true;
}
