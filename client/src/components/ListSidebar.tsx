import type { TodoList } from "../types";

interface ListSidebarProps {
  busy: boolean;
  lists: TodoList[];
  selectedListId: string | null;
  draftName: string;
  onDraftNameChange: (value: string) => void;
  onSelectList: (id: string) => void;
  onCreateList: () => Promise<void>;
}

export default function ListSidebar({
  busy,
  lists,
  selectedListId,
  draftName,
  onDraftNameChange,
  onSelectList,
  onCreateList,
}: ListSidebarProps) {
  return (
    <aside className="sidebar-card">
      <div className="sidebar-header">
        <div>
          <p className="eyebrow">Collection</p>
          <h2>Your lists</h2>
        </div>
        <span className="pill">{lists.length}</span>
      </div>

      <div className="sidebar-summary">
        <div className="summary-tile">
          <span className="summary-label">Focus mode</span>
          <strong>{selectedListId ? "One list active" : "Choose a list"}</strong>
        </div>
        <div className="summary-tile">
          <span className="summary-label">Library</span>
          <strong>{lists.length === 0 ? "Empty" : `${lists.length} saved`}</strong>
        </div>
      </div>

      <div className="field-group compact-gap">
        <label className="field">
          <span>Create a new list</span>
          <input
            value={draftName}
            onChange={(event) => onDraftNameChange(event.target.value)}
            placeholder="Sprint priorities"
          />
        </label>
        <button className="secondary-button full-width" disabled={busy} onClick={onCreateList} type="button">
          Add list
        </button>
      </div>

      <div className="list-stack">
        {lists.map((list) => (
          <button
            key={list.id}
            className={`list-tile ${selectedListId === list.id ? "is-selected" : ""}`}
            onClick={() => onSelectList(list.id)}
            type="button"
          >
            <span>{list.name}</span>
            <small>{selectedListId === list.id ? "Open now" : "Open workspace"}</small>
          </button>
        ))}
        {lists.length === 0 ? <p className="empty-text">Create your first list to get started.</p> : null}
      </div>
    </aside>
  );
}
