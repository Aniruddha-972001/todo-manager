import { useState } from "react";
import type { TodoListWithTodos } from "../types";

interface TodoWorkspaceProps {
  busy: boolean;
  list: TodoListWithTodos | null;
  onRenameList: (name: string) => Promise<void>;
  onDeleteList: () => Promise<void>;
  onCreateTodo: (task: string) => Promise<void>;
  onToggleTodo: (todoId: string, completed: boolean) => Promise<void>;
  onRenameTodo: (todoId: string, task: string) => Promise<void>;
  onDeleteTodo: (todoId: string) => Promise<void>;
}

export default function TodoWorkspace({
  busy,
  list,
  onRenameList,
  onDeleteList,
  onCreateTodo,
  onToggleTodo,
  onRenameTodo,
  onDeleteTodo,
}: TodoWorkspaceProps) {
  const [nextTask, setNextTask] = useState("");
  const [renameDraft, setRenameDraft] = useState("");

  const completedCount = list?.todos.filter((todo) => todo.completed).length ?? 0;
  const totalCount = list?.todos.length ?? 0;

  if (!list) {
    return (
      <section className="workspace-card empty-state">
        <p className="eyebrow">Workspace</p>
        <h2>Choose a list to begin.</h2>
        <p>
          Once you select a list, this panel turns into your operational board for adding, checking off,
          renaming, and clearing work.
        </p>
      </section>
    );
  }

  return (
    <section className="workspace-card">
      <div className="workspace-header">
        <div>
          <p className="eyebrow">Active board</p>
          <h2>{list.name}</h2>
          <p className="workspace-subcopy">
            {completedCount} of {totalCount} tasks completed
          </p>
        </div>
        <button className="ghost-button danger" disabled={busy} onClick={onDeleteList} type="button">
          Delete list
        </button>
      </div>

      <div className="workspace-metrics">
        <div className="metric-card">
          <span className="summary-label">Open tasks</span>
          <strong>{Math.max(totalCount - completedCount, 0)}</strong>
        </div>
        <div className="metric-card">
          <span className="summary-label">Completed</span>
          <strong>{completedCount}</strong>
        </div>
        <div className="metric-card">
          <span className="summary-label">Completion</span>
          <strong>{totalCount === 0 ? "0%" : `${Math.round((completedCount / totalCount) * 100)}%`}</strong>
        </div>
      </div>

      <div className="grid-row">
        <label className="field">
          <span>Rename list</span>
          <input
            value={renameDraft}
            onChange={(event) => setRenameDraft(event.target.value)}
            placeholder={list.name}
          />
        </label>
        <button
          className="secondary-button"
          disabled={busy || renameDraft.trim().length === 0}
          onClick={async () => {
            await onRenameList(renameDraft);
            setRenameDraft("");
          }}
          type="button"
        >
          Save name
        </button>
      </div>

      <div className="grid-row">
        <label className="field field-grow">
          <span>New todo</span>
          <input
            value={nextTask}
            onChange={(event) => setNextTask(event.target.value)}
            placeholder="Ship the UI polish"
          />
        </label>
        <button
          className="primary-button"
          disabled={busy || nextTask.trim().length === 0}
          onClick={async () => {
            await onCreateTodo(nextTask);
            setNextTask("");
          }}
          type="button"
        >
          Add todo
        </button>
      </div>

      <div className="todo-stack">
        {list.todos.map((todo) => (
          <article className={`todo-card ${todo.completed ? "is-done" : ""}`} key={todo.id}>
            <div className="todo-main">
              <label className="todo-check">
                <input
                  checked={todo.completed}
                  onChange={(event) => onToggleTodo(todo.id, event.target.checked)}
                  type="checkbox"
                />
                <span className={todo.completed ? "is-complete" : ""}>{todo.task}</span>
              </label>
              <p className="todo-meta">{todo.completed ? "Completed task" : "In progress"}</p>
            </div>
            <div className="todo-actions">
              <button
                className="ghost-button"
                disabled={busy}
                onClick={() => {
                  const nextLabel = window.prompt("Update todo", todo.task);
                  if (nextLabel && nextLabel.trim()) {
                    void onRenameTodo(todo.id, nextLabel);
                  }
                }}
                type="button"
              >
                Rename
              </button>
              <button className="ghost-button danger" disabled={busy} onClick={() => onDeleteTodo(todo.id)} type="button">
                Delete
              </button>
            </div>
          </article>
        ))}

        {list.todos.length === 0 ? <p className="empty-text">No todos yet. Add one to bring this list to life.</p> : null}
      </div>
    </section>
  );
}
