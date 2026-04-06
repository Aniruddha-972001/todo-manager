import { useMemo, useState } from "react";
import type { TodoListWithTodos, TodoPriority } from "../types";

interface TodoWorkspaceProps {
  busy: boolean;
  list: TodoListWithTodos | null;
  onRenameList: (name: string) => Promise<void>;
  onDeleteList: () => Promise<void>;
  onCreateTodo: (payload: { task: string; priority?: TodoPriority; dueDate?: string | null }) => Promise<void>;
  onToggleTodo: (todoId: string, completed: boolean) => Promise<void>;
  onUpdateTodoDetails: (
    todoId: string,
    payload: Partial<{
      task: string;
      completed: boolean;
      archived: boolean;
      priority: TodoPriority;
      dueDate: string | null;
    }>
  ) => Promise<void>;
  onDeleteTodo: (todoId: string) => Promise<void>;
  onReorderTodos: (orderedTodoIds: string[]) => Promise<void>;
}

type ViewMode = "all" | "open" | "completed" | "archived";

const priorityOptions: TodoPriority[] = ["low", "medium", "high"];

export default function TodoWorkspace({
  busy,
  list,
  onRenameList,
  onDeleteList,
  onCreateTodo,
  onToggleTodo,
  onUpdateTodoDetails,
  onDeleteTodo,
  onReorderTodos,
}: TodoWorkspaceProps) {
  const [nextTask, setNextTask] = useState("");
  const [nextPriority, setNextPriority] = useState<TodoPriority>("medium");
  const [nextDueDate, setNextDueDate] = useState("");
  const [renameDraft, setRenameDraft] = useState("");
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [editingTodoTask, setEditingTodoTask] = useState("");
  const [editingTodoPriority, setEditingTodoPriority] = useState<TodoPriority>("medium");
  const [editingTodoDueDate, setEditingTodoDueDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | TodoPriority>("all");
  const [draggedTodoId, setDraggedTodoId] = useState<string | null>(null);

  const completedCount = list?.todos.filter((todo) => todo.completed && !todo.archived).length ?? 0;
  const archivedCount = list?.todos.filter((todo) => todo.archived).length ?? 0;
  const activeCount = list?.todos.filter((todo) => !todo.archived).length ?? 0;

  const visibleTodos = useMemo(
    () =>
      list?.todos.filter((todo) => {
        const normalizedQuery = searchQuery.trim().toLowerCase();
        const matchesSearch =
          normalizedQuery.length === 0 ||
          todo.task.toLowerCase().includes(normalizedQuery) ||
          (todo.dueDate ?? "").includes(normalizedQuery) ||
          todo.priority.includes(normalizedQuery);

        const matchesView =
          viewMode === "all" ||
          (viewMode === "open" && !todo.completed && !todo.archived) ||
          (viewMode === "completed" && todo.completed && !todo.archived) ||
          (viewMode === "archived" && todo.archived);

        const matchesPriority = priorityFilter === "all" || todo.priority === priorityFilter;

        return matchesSearch && matchesView && matchesPriority;
      }) ?? [],
    [list?.todos, priorityFilter, searchQuery, viewMode]
  );

  if (!list) {
    return (
      <section className="workspace-card empty-state">
        <p className="eyebrow">Workspace</p>
        <h2>Choose a list to begin.</h2>
        <p>Pick a list on the left and this panel becomes your focused board for planning, shipping, and closing work.</p>
      </section>
    );
  }

  const visibleTodoIds = visibleTodos.map((todo) => todo.id);

  return (
    <section className="workspace-card">
      <div className="workspace-header">
        <div>
          <p className="eyebrow">Active board</p>
          <h2>{list.name}</h2>
          <p className="workspace-subcopy">
            {completedCount} of {activeCount} active tasks completed, {archivedCount} archived
          </p>
        </div>
        <button className="ghost-button danger" disabled={busy} onClick={onDeleteList} type="button">
          Delete list
        </button>
      </div>

      {busy ? <div className="workspace-status">Saving changes...</div> : null}

      <div className="workspace-metrics">
        <div className="metric-card">
          <span className="summary-label">Open tasks</span>
          <strong>{Math.max(activeCount - completedCount, 0)}</strong>
        </div>
        <div className="metric-card">
          <span className="summary-label">Completed</span>
          <strong>{completedCount}</strong>
        </div>
        <div className="metric-card">
          <span className="summary-label">Archived</span>
          <strong>{archivedCount}</strong>
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

      <div className="todo-create-grid">
        <label className="field field-grow">
          <span>New todo</span>
          <input
            value={nextTask}
            onChange={(event) => setNextTask(event.target.value)}
            placeholder="Ship the UI polish"
          />
        </label>
        <label className="field">
          <span>Priority</span>
          <select value={nextPriority} onChange={(event) => setNextPriority(event.target.value as TodoPriority)}>
            {priorityOptions.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Due date</span>
          <input type="date" value={nextDueDate} onChange={(event) => setNextDueDate(event.target.value)} />
        </label>
        <button
          className="primary-button"
          disabled={busy || nextTask.trim().length === 0}
          onClick={async () => {
            await onCreateTodo({
              task: nextTask,
              priority: nextPriority,
              dueDate: nextDueDate || null,
            });
            setNextTask("");
            setNextPriority("medium");
            setNextDueDate("");
          }}
          type="button"
        >
          Add todo
        </button>
      </div>

      <div className="workspace-toolbar">
        <label className="field field-grow">
          <span>Search todos</span>
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by task, date, or priority"
          />
        </label>

        <div className="toolbar-stack">
          <div className="filter-group" aria-label="Todo view filters">
            {(["all", "open", "completed", "archived"] as const).map((filterValue) => (
              <button
                key={filterValue}
                className={`filter-chip ${viewMode === filterValue ? "is-active" : ""}`}
                onClick={() => setViewMode(filterValue)}
                type="button"
              >
                {filterValue === "all"
                  ? "All"
                  : filterValue === "open"
                    ? "Open"
                    : filterValue === "completed"
                      ? "Completed"
                      : "Archived"}
              </button>
            ))}
          </div>

          <div className="filter-group" aria-label="Todo priority filters">
            {(["all", ...priorityOptions] as const).map((priorityValue) => (
              <button
                key={priorityValue}
                className={`filter-chip ${priorityFilter === priorityValue ? "is-active" : ""}`}
                onClick={() => setPriorityFilter(priorityValue)}
                type="button"
              >
                {priorityValue === "all" ? "Any priority" : priorityValue}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="todo-stack">
        {visibleTodos.map((todo) => (
          <article
            className={`todo-card ${todo.completed ? "is-done" : ""} ${todo.archived ? "is-archived" : ""}`}
            draggable={!busy && viewMode !== "completed" && viewMode !== "archived"}
            key={todo.id}
            onDragOver={(event) => {
              if (!draggedTodoId || draggedTodoId === todo.id || viewMode === "completed" || viewMode === "archived") {
                return;
              }

              event.preventDefault();
            }}
            onDrop={async (event) => {
              if (!draggedTodoId || draggedTodoId === todo.id || viewMode === "completed" || viewMode === "archived") {
                return;
              }

              event.preventDefault();
              const reorderedIds = [...visibleTodoIds];
              const fromIndex = reorderedIds.indexOf(draggedTodoId);
              const toIndex = reorderedIds.indexOf(todo.id);

              if (fromIndex === -1 || toIndex === -1) {
                setDraggedTodoId(null);
                return;
              }

              reorderedIds.splice(fromIndex, 1);
              reorderedIds.splice(toIndex, 0, draggedTodoId);

              const remainingIds = list.todos
                .filter((item) => !visibleTodoIds.includes(item.id))
                .map((item) => item.id);

              await onReorderTodos([...reorderedIds, ...remainingIds]);
              setDraggedTodoId(null);
            }}
            onDragStart={() => setDraggedTodoId(todo.id)}
            onDragEnd={() => setDraggedTodoId(null)}
          >
            <div className="todo-main">
              {editingTodoId === todo.id ? (
                <div className="todo-edit-grid">
                  <input
                    className="todo-inline-input"
                    value={editingTodoTask}
                    onChange={(event) => setEditingTodoTask(event.target.value)}
                    placeholder="Update todo"
                  />
                  <select
                    value={editingTodoPriority}
                    onChange={(event) => setEditingTodoPriority(event.target.value as TodoPriority)}
                  >
                    {priorityOptions.map((priority) => (
                      <option key={priority} value={priority}>
                        {priority}
                      </option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={editingTodoDueDate}
                    onChange={(event) => setEditingTodoDueDate(event.target.value)}
                  />
                  <div className="todo-inline-actions">
                    <button
                      className="secondary-button"
                      disabled={busy || editingTodoTask.trim().length === 0}
                      onClick={async () => {
                        await onUpdateTodoDetails(todo.id, {
                          task: editingTodoTask,
                          priority: editingTodoPriority,
                          dueDate: editingTodoDueDate || null,
                        });
                        setEditingTodoId(null);
                        setEditingTodoTask("");
                        setEditingTodoPriority("medium");
                        setEditingTodoDueDate("");
                      }}
                      type="button"
                    >
                      Save
                    </button>
                    <button
                      className="ghost-button"
                      disabled={busy}
                      onClick={() => {
                        setEditingTodoId(null);
                        setEditingTodoTask("");
                        setEditingTodoPriority("medium");
                        setEditingTodoDueDate("");
                      }}
                      type="button"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <label className="todo-check">
                    <input
                      checked={todo.completed}
                      onChange={(event) => onToggleTodo(todo.id, event.target.checked)}
                      type="checkbox"
                    />
                    <span className={todo.completed ? "is-complete" : ""}>{todo.task}</span>
                  </label>
                  <div className="todo-meta-row">
                    <p className="todo-meta">{todo.archived ? "Archived" : todo.completed ? "Completed task" : "In progress"}</p>
                    <div className="todo-badges">
                      <span className={`priority-badge priority-${todo.priority}`}>{todo.priority}</span>
                      {todo.dueDate ? <span className="todo-badge">Due {todo.dueDate}</span> : null}
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="todo-actions">
              <button
                className="ghost-button"
                disabled={busy}
                onClick={() => {
                  setEditingTodoId(todo.id);
                  setEditingTodoTask(todo.task);
                  setEditingTodoPriority(todo.priority);
                  setEditingTodoDueDate(todo.dueDate ?? "");
                }}
                type="button"
              >
                Edit
              </button>
              <button
                className="ghost-button"
                disabled={busy}
                onClick={() => onUpdateTodoDetails(todo.id, { archived: !todo.archived })}
                type="button"
              >
                {todo.archived ? "Restore" : "Archive"}
              </button>
              <button className="ghost-button danger" disabled={busy} onClick={() => onDeleteTodo(todo.id)} type="button">
                Delete
              </button>
            </div>
          </article>
        ))}

        {list.todos.length === 0 ? (
          <div className="workspace-empty-card">
            <strong>No todos yet.</strong>
            <p>Add a task with a due date or priority to turn this list into a working board.</p>
          </div>
        ) : null}

        {list.todos.length > 0 && visibleTodos.length === 0 ? (
          <div className="workspace-empty-card">
            <strong>No matching todos.</strong>
            <p>Try a different search term, switch views, or clear the priority filter.</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
