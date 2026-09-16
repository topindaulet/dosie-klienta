// Прототип «Досье клиента» по PRD2.md.
// Хранение — только localStorage браузера (демо-режим). В продуктиве это заменяется
// на серверное хранение с ролевой моделью, аудитом и SSO/AD (см. PRD2.md, разделы 5, 6).

const STORAGE_KEY = 'client-dossier-cards-v1';

const state = {
  clientType: 'legal',
  items: {}, // itemKey -> { found: string, checkedDate: string }
  currentCardId: null,
};

function itemKey(sectionId, index) {
  return `${sectionId}::${index}`;
}

function getClientFields() {
  return {
    name: document.getElementById('clientName').value.trim(),
    iin: document.getElementById('clientIin').value.trim(),
    bin: document.getElementById('clientBin').value.trim(),
    meetingDate: document.getElementById('meetingDate').value,
    meetingGoal: document.getElementById('meetingGoal').value.trim(),
    employee: document.getElementById('employeeName').value.trim(),
  };
}

function sectionsForType(type) {
  if (type === 'legal') return CHECKLIST_SECTIONS.legal;
  if (type === 'individual') return CHECKLIST_SECTIONS.individual;
  return [...CHECKLIST_SECTIONS.legal, ...CHECKLIST_SECTIONS.individual];
}

function buildSearchUrl(item, client) {
  const idValue = item.useId === 'bin' ? client.bin : item.useId === 'iin' ? client.iin : '';
  const queryParts = [];
  if (client.name) queryParts.push(`"${client.name}"`);
  if (idValue) queryParts.push(idValue);
  if (queryParts.length === 0) queryParts.push('клиент');

  let q = queryParts.join(' ');
  if (item.news) {
    return `https://www.google.com/search?q=${encodeURIComponent(q)}&tbm=nws`;
  }
  if (item.domains && item.domains.length > 0) {
    const siteFilter = item.domains.map((d) => `site:${d}`).join(' OR ');
    q = `${q} (${siteFilter})`;
  }
  return `https://www.google.com/search?q=${encodeURIComponent(q)}`;
}

function mainSiteUrl(item) {
  if (!item.domains || item.domains.length === 0) return null;
  return `https://${item.domains[0]}`;
}

function renderChecklist() {
  const container = document.getElementById('checklistContainer');
  container.innerHTML = '';
  const client = getClientFields();
  const sections = sectionsForType(state.clientType);

  sections.forEach((section) => {
    const sectionEl = document.createElement('div');
    sectionEl.className = 'checklist-section';

    const heading = document.createElement('h3');
    heading.textContent = section.title;
    sectionEl.appendChild(heading);

    section.items.forEach((item, index) => {
      const key = itemKey(section.id, index);
      const saved = state.items[key] || { found: '', checkedDate: '' };

      const itemEl = document.createElement('div');
      itemEl.className = 'checklist-item';

      const top = document.createElement('div');
      top.className = 'checklist-item-top';

      const textWrap = document.createElement('div');
      const paramEl = document.createElement('div');
      paramEl.className = 'checklist-item-param';
      paramEl.textContent = item.param;
      const sourceEl = document.createElement('div');
      sourceEl.className = 'checklist-item-source';
      sourceEl.textContent = `Источник: ${item.sourceLabel}`;
      textWrap.appendChild(paramEl);
      textWrap.appendChild(sourceEl);

      const linksWrap = document.createElement('div');
      linksWrap.className = 'checklist-item-links';

      const site = mainSiteUrl(item);
      if (site) {
        const siteLink = document.createElement('a');
        siteLink.className = 'link-btn';
        siteLink.href = site;
        siteLink.target = '_blank';
        siteLink.rel = 'noopener noreferrer';
        siteLink.textContent = 'Открыть источник';
        linksWrap.appendChild(siteLink);
      }

      const searchLink = document.createElement('a');
      searchLink.className = 'link-btn';
      searchLink.href = buildSearchUrl(item, client);
      searchLink.target = '_blank';
      searchLink.rel = 'noopener noreferrer';
      searchLink.textContent = item.news ? 'Найти новости' : 'Найти по клиенту';
      linksWrap.appendChild(searchLink);

      top.appendChild(textWrap);
      top.appendChild(linksWrap);

      const body = document.createElement('div');
      body.className = 'checklist-item-body';

      const textarea = document.createElement('textarea');
      textarea.placeholder = 'Что нашли по этому пункту...';
      textarea.value = saved.found;
      textarea.addEventListener('input', () => {
        state.items[key] = state.items[key] || {};
        state.items[key].found = textarea.value;
      });

      const dateWrap = document.createElement('div');
      dateWrap.className = 'date-field';
      const dateLabel = document.createElement('label');
      dateLabel.textContent = 'Дата проверки';
      const dateInput = document.createElement('input');
      dateInput.type = 'date';
      dateInput.value = saved.checkedDate;
      dateInput.addEventListener('change', () => {
        state.items[key] = state.items[key] || {};
        state.items[key].checkedDate = dateInput.value;
      });
      dateWrap.appendChild(dateLabel);
      dateWrap.appendChild(dateInput);

      body.appendChild(textarea);
      body.appendChild(dateWrap);

      itemEl.appendChild(top);
      itemEl.appendChild(body);
      sectionEl.appendChild(itemEl);
    });

    container.appendChild(sectionEl);
  });
}

function collectFilledItems() {
  const client = getClientFields();
  const sections = sectionsForType(state.clientType);
  const rows = [];
  sections.forEach((section) => {
    section.items.forEach((item, index) => {
      const key = itemKey(section.id, index);
      const saved = state.items[key];
      if (saved && (saved.found || saved.checkedDate)) {
        rows.push({
          section: section.title,
          param: item.param,
          found: saved.found || '',
          checkedDate: saved.checkedDate || '',
        });
      }
    });
  });
  return { client, rows };
}

function typeLabel() {
  if (state.clientType === 'legal') return 'Юридическое лицо';
  if (state.clientType === 'individual') return 'Физическое лицо';
  return 'Не уверен (юр. + физ. лицо)';
}

function buildSummaryText() {
  const { client, rows } = collectFilledItems();
  const lines = [];
  lines.push('ДОСЬЕ КЛИЕНТА — подготовка к встрече');
  lines.push(`Тип клиента: ${typeLabel()}`);
  if (client.name) lines.push(`ФИО/Наименование: ${client.name}`);
  if (client.iin) lines.push(`ИИН: ${client.iin}`);
  if (client.bin) lines.push(`БИН: ${client.bin}`);
  if (client.meetingDate) lines.push(`Дата встречи: ${client.meetingDate}`);
  if (client.meetingGoal) lines.push(`Цель встречи/продукт: ${client.meetingGoal}`);
  if (client.employee) lines.push(`Подготовил: ${client.employee}`);
  lines.push('');
  if (rows.length === 0) {
    lines.push('По чек-листу пока ничего не внесено.');
  } else {
    rows.forEach((row) => {
      lines.push(`[${row.section}] ${row.param}`);
      if (row.checkedDate) lines.push(`  Дата проверки: ${row.checkedDate}`);
      lines.push(`  Найдено: ${row.found || '—'}`);
      lines.push('');
    });
  }
  lines.push('---');
  lines.push('Источник данных: только общедоступная информация (открытые госреестры, СМИ, публичные профили).');
  lines.push('Данные внутренних систем банка в этот документ не вносятся.');
  return lines.join('\n');
}

function buildExportHtml() {
  const { client, rows } = collectFilledItems();
  const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  let rowsHtml = '';
  if (rows.length === 0) {
    rowsHtml = '<p><i>По чек-листу пока ничего не внесено.</i></p>';
  } else {
    let currentSection = null;
    rows.forEach((row) => {
      if (row.section !== currentSection) {
        currentSection = row.section;
        rowsHtml += `<h3>${esc(currentSection)}</h3>`;
      }
      rowsHtml += `
        <table style="width:100%; border-collapse:collapse; margin-bottom:10px;">
          <tr><td style="width:35%; font-weight:bold; border:1px solid #ccc; padding:6px;">${esc(row.param)}</td>
              <td style="border:1px solid #ccc; padding:6px;">${esc(row.found) || '—'}</td></tr>
          <tr><td style="border:1px solid #ccc; padding:6px;">Дата проверки</td>
              <td style="border:1px solid #ccc; padding:6px;">${esc(row.checkedDate) || '—'}</td></tr>
        </table>`;
    });
  }

  return `
  <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
  <head><meta charset="utf-8"><title>Досье клиента</title></head>
  <body style="font-family: Calibri, Arial, sans-serif;">
    <h1>Досье клиента — подготовка к встрече</h1>
    <p><b>Тип клиента:</b> ${esc(typeLabel())}</p>
    ${client.name ? `<p><b>ФИО/Наименование:</b> ${esc(client.name)}</p>` : ''}
    ${client.iin ? `<p><b>ИИН:</b> ${esc(client.iin)}</p>` : ''}
    ${client.bin ? `<p><b>БИН:</b> ${esc(client.bin)}</p>` : ''}
    ${client.meetingDate ? `<p><b>Дата встречи:</b> ${esc(client.meetingDate)}</p>` : ''}
    ${client.meetingGoal ? `<p><b>Цель встречи/продукт:</b> ${esc(client.meetingGoal)}</p>` : ''}
    ${client.employee ? `<p><b>Подготовил:</b> ${esc(client.employee)}</p>` : ''}
    <hr>
    ${rowsHtml}
    <hr>
    <p style="font-size:11px; color:#666;">Источник данных: только общедоступная информация (открытые госреестры, СМИ, публичные профили).
    Данные внутренних систем банка в этот документ не вносятся.</p>
  </body>
  </html>`;
}

function exportToWord() {
  const html = buildExportHtml();
  const blob = new Blob(['﻿', html], { type: 'application/msword' });
  const client = getClientFields();
  const safeName = (client.name || 'клиент').replace(/[\\/:*?"<>|]+/g, '_').slice(0, 60);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Досье_${safeName}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function copySummary() {
  const text = buildSummaryText();
  const statusEl = document.getElementById('saveStatus');
  try {
    await navigator.clipboard.writeText(text);
    statusEl.textContent = 'Сводка скопирована в буфер обмена.';
    statusEl.classList.remove('error');
  } catch (e) {
    statusEl.textContent = 'Не удалось скопировать автоматически — скопируйте текст вручную.';
    statusEl.classList.add('error');
  }
}

function loadCards() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch (e) {
    return [];
  }
}

function persistCards(cards) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
}

function saveCurrentCard() {
  const client = getClientFields();
  const cards = loadCards();
  const now = new Date().toISOString();
  const payload = {
    id: state.currentCardId || `card_${Date.now()}`,
    client,
    clientType: state.clientType,
    items: state.items,
    createdAt: state.currentCardId ? undefined : now,
    updatedAt: now,
    history: [],
  };

  const existingIndex = cards.findIndex((c) => c.id === payload.id);
  const statusEl = document.getElementById('saveStatus');

  if (existingIndex >= 0) {
    const existing = cards[existingIndex];
    payload.createdAt = existing.createdAt;
    payload.history = [...(existing.history || []), { at: now, by: client.employee || 'неизвестно' }];
    cards[existingIndex] = payload;
    statusEl.textContent = `Карточка обновлена (${new Date(now).toLocaleString('ru-RU')}).`;
  } else {
    payload.history = [{ at: now, by: client.employee || 'неизвестно' }];
    cards.push(payload);
    statusEl.textContent = 'Карточка сохранена локально.';
  }

  statusEl.classList.remove('error');
  state.currentCardId = payload.id;
  persistCards(cards);
}

function renderMyCards() {
  const listEl = document.getElementById('myCardsList');
  const cards = loadCards();
  listEl.innerHTML = '';

  if (cards.length === 0) {
    listEl.innerHTML = '<div class="empty-state">Пока нет сохранённых карточек.</div>';
    return;
  }

  cards
    .slice()
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .forEach((card) => {
      const row = document.createElement('div');
      row.className = 'card-row';

      const info = document.createElement('div');
      info.className = 'card-row-info';
      const nameEl = document.createElement('div');
      nameEl.className = 'card-row-name';
      nameEl.textContent = card.client.name || '(без имени)';
      const metaEl = document.createElement('div');
      metaEl.className = 'card-row-meta';
      const typeText = card.clientType === 'legal' ? 'Юр. лицо' : card.clientType === 'individual' ? 'Физ. лицо' : 'Оба';
      metaEl.textContent = `${typeText} · изменено ${new Date(card.updatedAt).toLocaleString('ru-RU')} · встреча: ${card.client.meetingDate || '—'}`;
      info.appendChild(nameEl);
      info.appendChild(metaEl);

      const actions = document.createElement('div');
      actions.className = 'card-row-actions';

      const openBtn = document.createElement('button');
      openBtn.className = 'btn btn-secondary';
      openBtn.textContent = 'Открыть';
      openBtn.addEventListener('click', () => {
        loadCardIntoForm(card);
        closeMyCards();
      });

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn btn-secondary';
      deleteBtn.textContent = 'Удалить';
      deleteBtn.addEventListener('click', () => {
        if (!confirm('Удалить эту карточку без возможности восстановления?')) return;
        const remaining = loadCards().filter((c) => c.id !== card.id);
        persistCards(remaining);
        renderMyCards();
      });

      actions.appendChild(openBtn);
      actions.appendChild(deleteBtn);

      row.appendChild(info);
      row.appendChild(actions);
      listEl.appendChild(row);
    });
}

function loadCardIntoForm(card) {
  document.getElementById('clientName').value = card.client.name || '';
  document.getElementById('clientIin').value = card.client.iin || '';
  document.getElementById('clientBin').value = card.client.bin || '';
  document.getElementById('meetingDate').value = card.client.meetingDate || '';
  document.getElementById('meetingGoal').value = card.client.meetingGoal || '';
  document.getElementById('employeeName').value = card.client.employee || '';

  state.clientType = card.clientType;
  document.querySelector(`input[name="clientType"][value="${card.clientType}"]`).checked = true;
  state.items = card.items || {};
  state.currentCardId = card.id;

  renderChecklist();
  const statusEl = document.getElementById('saveStatus');
  statusEl.textContent = `Загружена карточка «${card.client.name || 'без имени'}».`;
  statusEl.classList.remove('error');
}

function resetForNewCard() {
  document.getElementById('clientName').value = '';
  document.getElementById('clientIin').value = '';
  document.getElementById('clientBin').value = '';
  document.getElementById('meetingDate').value = '';
  document.getElementById('meetingGoal').value = '';
  state.clientType = 'legal';
  document.querySelector('input[name="clientType"][value="legal"]').checked = true;
  state.items = {};
  state.currentCardId = null;
  renderChecklist();
  const statusEl = document.getElementById('saveStatus');
  statusEl.textContent = 'Новая карточка. Заполните данные клиента.';
  statusEl.classList.remove('error');
}

function openMyCards() {
  renderMyCards();
  document.getElementById('myCardsModal').hidden = false;
}

function closeMyCards() {
  document.getElementById('myCardsModal').hidden = true;
}

function attachEvents() {
  document.querySelectorAll('input[name="clientType"]').forEach((radio) => {
    radio.addEventListener('change', (e) => {
      state.clientType = e.target.value;
      renderChecklist();
    });
  });

  document.getElementById('clientName').addEventListener('input', renderChecklist);
  document.getElementById('clientIin').addEventListener('input', renderChecklist);
  document.getElementById('clientBin').addEventListener('input', renderChecklist);

  document.getElementById('btnExportWord').addEventListener('click', exportToWord);
  document.getElementById('btnCopySummary').addEventListener('click', copySummary);
  document.getElementById('btnSaveCard').addEventListener('click', saveCurrentCard);

  document.getElementById('btnMyCards').addEventListener('click', openMyCards);
  document.getElementById('btnCloseMyCards').addEventListener('click', closeMyCards);
  document.getElementById('myCardsModal').addEventListener('click', (e) => {
    if (e.target.id === 'myCardsModal') closeMyCards();
  });

  document.getElementById('btnNewCard').addEventListener('click', resetForNewCard);

  document.getElementById('btnGenerateChecklist').addEventListener('click', (e) => {
    const btn = e.currentTarget;
    if (btn.disabled) return;

    const originalText = btn.textContent;
    btn.disabled = true;
    btn.classList.add('btn-loading');
    btn.textContent = 'Формируем чек-лист…';

    setTimeout(() => {
      renderChecklist();
      const panel = document.querySelector('.checklist-panel');
      panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      panel.classList.remove('highlight');
      // force reflow so the animation restarts on repeated clicks
      void panel.offsetWidth;
      panel.classList.add('highlight');

      btn.disabled = false;
      btn.classList.remove('btn-loading');
      btn.textContent = originalText;
    }, 400);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  attachEvents();
  renderChecklist();
});
