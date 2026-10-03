import { $, h } from '../core/dom';
import { onLangChange, t } from '../core/i18n';
import type { Store } from '../core/storage';
import { KEYS, uid, type Todo } from '../core/types';

export function mountTodos(store: Store): void {
  const form = $<HTMLFormElement>('#todoForm');
  const input = $<HTMLInputElement>('#todoInput');
  const list = $<HTMLUListElement>('#todoList');

  const get = () => store.get<Todo[]>(KEYS.todos, []);
  const save = (todos: Todo[]) => store.set(KEYS.todos, todos);

  const render = () => {
    const todos = get();
    list.replaceChildren(
      ...todos.map((todo) =>
        h(
          'li',
          { class: `todo-item${todo.completed ? ' completed' : ''}`, 'data-id': todo.id },
          h('button', {
            type: 'button',
            class: `todo-checkbox${todo.completed ? ' checked' : ''}`,
            role: 'checkbox',
            'aria-checked': String(todo.completed),
            'aria-label': t('todos.toggle'),
            'data-action': 'toggle',
          }),
          h('span', { class: 'todo-text', text: todo.text }),
          h('button', {
            type: 'button',
            class: 'todo-delete',
            'aria-label': t('todos.delete'),
            'data-action': 'delete',
            text: '×',
          }),
        ),
      ),
    );
    if (todos.length === 0) list.append(h('li', { class: 'empty-state', text: t('todos.empty') }));
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    save([...get(), { id: uid(), text, completed: false, createdAt: Date.now() }]);
    input.value = '';
  });

  list.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement).closest<HTMLElement>('[data-action]');
    const item = target?.closest<HTMLElement>('.todo-item');
    if (!target || !item) return;
    const id = item.dataset.id;
    if (target.dataset.action === 'toggle') {
      save(get().map((td) => (td.id === id ? { ...td, completed: !td.completed } : td)));
    } else if (target.dataset.action === 'delete') {
      item.classList.add('slide-out');
      setTimeout(() => save(get().filter((td) => td.id !== id)), 250);
    }
  });

  store.subscribe(KEYS.todos, render);
  onLangChange(render);
  render();
}
