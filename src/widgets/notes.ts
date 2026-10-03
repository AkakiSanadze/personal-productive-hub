import { $ } from '../core/dom';
import { onLangChange, t } from '../core/i18n';
import type { Store } from '../core/storage';
import { KEYS } from '../core/types';

const MAX = 2000;

export function mountNotes(store: Store): void {
  const textarea = $<HTMLTextAreaElement>('#notesTextarea');
  const charCount = $('#charCount');
  const indicator = $('#saveIndicator');
  const indicatorText = $('.save-text', indicator);
  const copyBtn = $<HTMLButtonElement>('#copyNotesBtn');
  const clearBtn = $<HTMLButtonElement>('#clearNotesBtn');

  let saveTimer: ReturnType<typeof setTimeout> | undefined;
  let hideTimer: ReturnType<typeof setTimeout> | undefined;

  const updateCounter = () => {
    const count = textarea.value.length;
    charCount.textContent = String(count);
    const counter = charCount.parentElement!;
    counter.classList.toggle('danger', count > MAX * 0.9);
    counter.classList.toggle('warning', count > MAX * 0.75 && count <= MAX * 0.9);
  };

  const showSaved = () => {
    indicator.classList.add('visible');
    indicator.classList.remove('saving');
    indicatorText.textContent = t('notes.saved');
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => indicator.classList.remove('visible'), 2000);
  };

  const save = () => {
    store.set(KEYS.notes, textarea.value);
    showSaved();
  };

  textarea.value = store.get<string>(KEYS.notes, '');
  updateCounter();

  textarea.addEventListener('input', () => {
    updateCounter();
    indicator.classList.add('visible', 'saving');
    indicatorText.textContent = t('notes.saving');
    clearTimeout(saveTimer);
    saveTimer = setTimeout(save, 400);
  });

  copyBtn.addEventListener('click', async () => {
    if (!textarea.value) return;
    try {
      await navigator.clipboard.writeText(textarea.value);
      copyBtn.textContent = t('notes.copied');
      setTimeout(() => (copyBtn.textContent = t('notes.copy')), 1500);
    } catch {
      textarea.select();
    }
  });

  clearBtn.addEventListener('click', () => {
    if (textarea.value && !confirm(t('notes.confirmClear'))) return;
    textarea.value = '';
    updateCounter();
    save();
  });

  // Another tab edited notes: update unless the user is typing here.
  store.subscribe(KEYS.notes, (value) => {
    if (
      document.activeElement !== textarea &&
      typeof value === 'string' &&
      value !== textarea.value
    ) {
      textarea.value = value;
      updateCounter();
    }
  });

  onLangChange(() => {
    if (indicator.classList.contains('visible')) indicatorText.textContent = t('notes.saved');
  });
}
