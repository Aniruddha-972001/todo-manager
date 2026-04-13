import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  clearStoredToken,
  createList,
  createTodo,
  deleteTodo,
  getApiBaseUrl,
  getCurrentUser,
  getList,
  getLists,
  hydrateStoredToken,
  login,
  logout,
  reorderTodos,
  signup,
  updateTodo,
} from "./api";
import type { AuthUser, TodoItem, TodoList, TodoListWithTodos, TodoPriority, TodoView } from "./types";

const priorityOptions: TodoPriority[] = ["low", "medium", "high"];
const viewOptions: TodoView[] = ["all", "open", "completed", "archived"];

export default function TodoManagerMobileApp() {
  const [busy, setBusy] = useState(false);
  const [booting, setBooting] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [lists, setLists] = useState<TodoList[]>([]);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [selectedList, setSelectedList] = useState<TodoListWithTodos | null>(null);
  const [newListName, setNewListName] = useState("");
  const [newTask, setNewTask] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<TodoPriority>("medium");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<TodoView>("all");

  const visibleTodos = useMemo(() => {
    const todos = selectedList?.todos ?? [];
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return todos.filter((todo) => {
      const matchesSearch =
        normalizedQuery.length === 0 ||
        todo.task.toLowerCase().includes(normalizedQuery) ||
        todo.priority.includes(normalizedQuery) ||
        (todo.dueDate ?? "").includes(normalizedQuery);

      const matchesView =
        viewMode === "all" ||
        (viewMode === "open" && !todo.completed && !todo.archived) ||
        (viewMode === "completed" && todo.completed && !todo.archived) ||
        (viewMode === "archived" && todo.archived);

      return matchesSearch && matchesView;
    });
  }, [searchQuery, selectedList?.todos, viewMode]);

  const activeTodos = selectedList?.todos.filter((todo) => !todo.archived) ?? [];
  const completedCount = activeTodos.filter((todo) => todo.completed).length;

  async function withFeedback(task: () => Promise<void>) {
    setBusy(true);
    setError(null);

    try {
      await task();
    } catch (taskError) {
      setError(taskError instanceof Error ? taskError.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function loadLists(preferredListId?: string | null) {
    const response = await getLists();
    setLists(response.lists);

    const nextListId = preferredListId ?? selectedListId ?? response.lists[0]?.id ?? null;
    setSelectedListId(nextListId);

    if (!nextListId) {
      setSelectedList(null);
      return;
    }

    const listResponse = await getList(nextListId);
    setSelectedList(listResponse.list);
  }

  useEffect(() => {
    void (async () => {
      try {
        const token = await hydrateStoredToken();

        if (!token) {
          setBooting(false);
          return;
        }

        const meResponse = await getCurrentUser();
        setUser(meResponse.user);
        await loadLists();
      } catch {
        await clearStoredToken();
        setUser(null);
      } finally {
        setBooting(false);
      }
    })();
  }, []);

  const handleAuthSubmit = async () => {
    await withFeedback(async () => {
      if (authMode === "signup") {
        const response = await signup(username, password);
        setMessage(`${response.message}. You can log in now.`);
        setAuthMode("login");
        setPassword("");
        return;
      }

      const response = await login(username, password);
      setMessage(response.message);
      const meResponse = await getCurrentUser();
      setUser(meResponse.user);
      await loadLists();
    });
  };

  const handleLogout = async () => {
    await withFeedback(async () => {
      await logout();
      setUser(null);
      setLists([]);
      setSelectedListId(null);
      setSelectedList(null);
      setPassword("");
      setMessage("Logged out successfully");
    });
  };

  const handleCreateList = async () => {
    await withFeedback(async () => {
      const response = await createList(newListName);
      setNewListName("");
      setMessage(response.message);
      await loadLists(response.list.id);
    });
  };

  const handleCreateTodo = async () => {
    if (!selectedListId) {
      return;
    }

    await withFeedback(async () => {
      const response = await createTodo(selectedListId, {
        task: newTask,
        priority: newTaskPriority,
        dueDate: newTaskDueDate || null,
      });
      setMessage(response.message);
      setNewTask("");
      setNewTaskPriority("medium");
      setNewTaskDueDate("");
      const listResponse = await getList(selectedListId);
      setSelectedList(listResponse.list);
    });
  };

  const refreshSelectedList = async (listId = selectedListId) => {
    if (!listId) {
      return;
    }

    const response = await getList(listId);
    setSelectedList(response.list);
  };

  const handleUpdateTodo = async (
    todoId: string,
    payload: Partial<Pick<TodoItem, "completed" | "archived" | "priority" | "dueDate">>
  ) => {
    await withFeedback(async () => {
      await updateTodo(todoId, payload);
      await refreshSelectedList();
    });
  };

  const handleDeleteTodo = async (todoId: string) => {
    await withFeedback(async () => {
      await deleteTodo(todoId);
      await refreshSelectedList();
    });
  };

  const handleMoveTodo = async (todoId: string, direction: "up" | "down") => {
    if (!selectedListId || !selectedList) {
      return;
    }

    const currentIndex = selectedList.todos.findIndex((todo) => todo.id === todoId);

    if (currentIndex === -1) {
      return;
    }

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= selectedList.todos.length) {
      return;
    }

    const orderedIds = selectedList.todos.map((todo) => todo.id);
    const [movedId] = orderedIds.splice(currentIndex, 1);
    orderedIds.splice(targetIndex, 0, movedId);

    await withFeedback(async () => {
      await reorderTodos(selectedListId, orderedIds);
      await refreshSelectedList(selectedListId);
    });
  };

  if (booting) {
    return (
      <SafeAreaView style={styles.bootContainer}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color="#2f7a55" />
        <Text style={styles.bootText}>Opening your mobile workspace…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.screen}>
        <Text style={styles.eyebrow}>Todo Manager Mobile</Text>
        <Text style={styles.title}>{user ? "Your tasks, now on mobile." : "Stay on top of work from anywhere."}</Text>
        <Text style={styles.subtitle}>
          {user
            ? `Connected to ${getApiBaseUrl()}`
            : "Log in with the same backend account you use on the web app."}
        </Text>

        {message ? <Text style={styles.successBanner}>{message}</Text> : null}
        {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

        {!user ? (
          <View style={styles.card}>
            <View style={styles.segmentRow}>
              <SegmentButton label="Log in" active={authMode === "login"} onPress={() => setAuthMode("login")} />
              <SegmentButton label="Sign up" active={authMode === "signup"} onPress={() => setAuthMode("signup")} />
            </View>

            <InputField label="Username" value={username} onChangeText={setUsername} placeholder="task_captain" />
            <InputField
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="At least 8 characters"
              secureTextEntry
            />

            <PrimaryButton
              label={busy ? "Working..." : authMode === "login" ? "Enter workspace" : "Create account"}
              disabled={busy}
              onPress={handleAuthSubmit}
            />
          </View>
        ) : (
          <>
            <View style={styles.card}>
              <View style={styles.rowBetween}>
                <View>
                  <Text style={styles.sectionTitle}>Workspace</Text>
                  <Text style={styles.metaText}>Signed in as {username || user.userId}</Text>
                </View>
                <Pressable onPress={handleLogout} style={styles.ghostButton}>
                  <Text style={styles.ghostButtonText}>Log out</Text>
                </Pressable>
              </View>

              <View style={styles.metricsRow}>
                <MetricCard label="Lists" value={String(lists.length)} />
                <MetricCard label="Done" value={`${completedCount}/${activeTodos.length}`} />
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Lists</Text>
              <InputField label="New list" value={newListName} onChangeText={setNewListName} placeholder="Sprint board" />
              <PrimaryButton label="Create list" disabled={busy || newListName.trim().length === 0} onPress={handleCreateList} />

              <View style={styles.listStack}>
                {lists.map((list) => (
                  <Pressable
                    key={list.id}
                    onPress={() => {
                      void withFeedback(async () => {
                        setSelectedListId(list.id);
                        const response = await getList(list.id);
                        setSelectedList(response.list);
                      });
                    }}
                    style={[styles.listTile, selectedListId === list.id ? styles.listTileActive : null]}
                  >
                    <Text style={styles.listTileTitle}>{list.name}</Text>
                    <Text style={styles.listTileMeta}>{selectedListId === list.id ? "Open now" : "Tap to open"}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>{selectedList ? selectedList.name : "Choose a list"}</Text>
              <Text style={styles.metaText}>
                {selectedList
                  ? `${completedCount} of ${activeTodos.length} active tasks completed`
                  : "Select a list to create and manage mobile tasks."}
              </Text>

              {selectedList ? (
                <>
                  <InputField label="New todo" value={newTask} onChangeText={setNewTask} placeholder="Reply to launch feedback" />
                  <InputField
                    label="Due date (optional)"
                    value={newTaskDueDate}
                    onChangeText={setNewTaskDueDate}
                    placeholder="YYYY-MM-DD"
                  />

                  <View style={styles.priorityRow}>
                    {priorityOptions.map((priority) => (
                      <SegmentButton
                        key={priority}
                        label={priority}
                        active={newTaskPriority === priority}
                        onPress={() => setNewTaskPriority(priority)}
                      />
                    ))}
                  </View>

                  <PrimaryButton
                    label="Add todo"
                    disabled={busy || newTask.trim().length === 0}
                    onPress={handleCreateTodo}
                  />

                  <InputField
                    label="Search todos"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search by task, due date, or priority"
                  />

                  <View style={styles.segmentRowWrap}>
                    {viewOptions.map((view) => (
                      <SegmentButton
                        key={view}
                        label={view}
                        active={viewMode === view}
                        onPress={() => setViewMode(view)}
                      />
                    ))}
                  </View>

                  <View style={styles.todoStack}>
                    {visibleTodos.map((todo) => (
                      <View key={todo.id} style={[styles.todoCard, todo.archived ? styles.todoCardArchived : null]}>
                        <View style={styles.rowBetween}>
                          <View style={styles.todoCopy}>
                            <Text style={[styles.todoTitle, todo.completed ? styles.todoTitleDone : null]}>{todo.task}</Text>
                            <Text style={styles.todoMeta}>
                              {todo.priority.toUpperCase()}
                              {todo.dueDate ? ` • due ${todo.dueDate}` : ""}
                              {todo.archived ? " • archived" : todo.completed ? " • completed" : " • open"}
                            </Text>
                          </View>

                          <View style={styles.orderButtons}>
                            <MiniButton label="↑" onPress={() => handleMoveTodo(todo.id, "up")} />
                            <MiniButton label="↓" onPress={() => handleMoveTodo(todo.id, "down")} />
                          </View>
                        </View>

                        <View style={styles.actionWrap}>
                          <MiniButton label={todo.completed ? "Undo" : "Done"} onPress={() => handleUpdateTodo(todo.id, { completed: !todo.completed })} />
                          <MiniButton
                            label={todo.archived ? "Restore" : "Archive"}
                            onPress={() => handleUpdateTodo(todo.id, { archived: !todo.archived })}
                          />
                          <MiniButton
                            label={`Priority: ${todo.priority}`}
                            onPress={() => {
                              const nextPriority =
                                todo.priority === "low" ? "medium" : todo.priority === "medium" ? "high" : "low";
                              void handleUpdateTodo(todo.id, { priority: nextPriority });
                            }}
                          />
                          <MiniButton label="Delete" danger onPress={() => handleDeleteTodo(todo.id)} />
                        </View>
                      </View>
                    ))}

                    {visibleTodos.length === 0 ? (
                      <Text style={styles.emptyText}>No todos match this view yet.</Text>
                    ) : null}
                  </View>
                </>
              ) : null}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function InputField(props: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{props.label}</Text>
      <TextInput
        style={styles.input}
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        placeholderTextColor="#7a8377"
        secureTextEntry={props.secureTextEntry}
        autoCapitalize="none"
      />
    </View>
  );
}

function PrimaryButton(props: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable onPress={props.onPress} disabled={props.disabled} style={[styles.primaryButton, props.disabled ? styles.buttonDisabled : null]}>
      <Text style={styles.primaryButtonText}>{props.label}</Text>
    </Pressable>
  );
}

function SegmentButton(props: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={props.onPress} style={[styles.segmentButton, props.active ? styles.segmentButtonActive : null]}>
      <Text style={[styles.segmentButtonText, props.active ? styles.segmentButtonTextActive : null]}>{props.label}</Text>
    </Pressable>
  );
}

function MetricCard(props: { label: string; value: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{props.label}</Text>
      <Text style={styles.metricValue}>{props.value}</Text>
    </View>
  );
}

function MiniButton(props: { label: string; onPress: () => void; danger?: boolean }) {
  return (
    <Pressable onPress={props.onPress} style={[styles.miniButton, props.danger ? styles.miniButtonDanger : null]}>
      <Text style={[styles.miniButtonText, props.danger ? styles.miniButtonTextDanger : null]}>{props.label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#edf2e7",
  },
  screen: {
    padding: 20,
    gap: 18,
  },
  bootContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#edf2e7",
    gap: 12,
  },
  bootText: {
    color: "#415143",
    fontSize: 16,
  },
  eyebrow: {
    fontSize: 12,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "#1f5f41",
    fontWeight: "600",
  },
  title: {
    fontSize: 32,
    lineHeight: 36,
    fontWeight: "700",
    color: "#1d241d",
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: "#5d675a",
    marginTop: -8,
  },
  successBanner: {
    backgroundColor: "rgba(37,110,76,0.12)",
    color: "#256e4c",
    padding: 14,
    borderRadius: 16,
  },
  errorBanner: {
    backgroundColor: "rgba(157,59,50,0.12)",
    color: "#9d3b32",
    padding: 14,
    borderRadius: 16,
  },
  card: {
    backgroundColor: "rgba(255,253,248,0.96)",
    borderRadius: 24,
    padding: 18,
    gap: 14,
    shadowColor: "#202a1c",
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1d241d",
  },
  metaText: {
    color: "#5d675a",
    fontSize: 14,
  },
  field: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 13,
    color: "#5d675a",
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "rgba(48,59,39,0.12)",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: "rgba(255,255,255,0.92)",
    color: "#1d241d",
  },
  primaryButton: {
    backgroundColor: "#2f7a55",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 15,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  ghostButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "rgba(36,23,15,0.06)",
  },
  ghostButtonText: {
    color: "#1d241d",
    fontWeight: "600",
  },
  segmentRow: {
    flexDirection: "row",
    gap: 10,
  },
  segmentRowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  segmentButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "rgba(36,23,15,0.06)",
  },
  segmentButtonActive: {
    backgroundColor: "rgba(47,122,85,0.14)",
  },
  segmentButtonText: {
    color: "#5d675a",
    fontWeight: "600",
    textTransform: "capitalize",
  },
  segmentButtonTextActive: {
    color: "#1f5f41",
  },
  metricsRow: {
    flexDirection: "row",
    gap: 12,
  },
  metricCard: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: "#f7f8f2",
    padding: 14,
    gap: 6,
  },
  metricLabel: {
    color: "#5d675a",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  metricValue: {
    color: "#1d241d",
    fontSize: 24,
    fontWeight: "700",
  },
  listStack: {
    gap: 10,
  },
  listTile: {
    backgroundColor: "#f7f8f2",
    borderRadius: 18,
    padding: 14,
    gap: 4,
  },
  listTileActive: {
    borderWidth: 1,
    borderColor: "rgba(47,122,85,0.28)",
    backgroundColor: "rgba(47,122,85,0.12)",
  },
  listTileTitle: {
    fontWeight: "700",
    color: "#1d241d",
    fontSize: 16,
  },
  listTileMeta: {
    color: "#5d675a",
    fontSize: 13,
  },
  priorityRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  todoStack: {
    gap: 12,
  },
  todoCard: {
    borderRadius: 20,
    padding: 14,
    gap: 12,
    backgroundColor: "#f7f8f2",
  },
  todoCardArchived: {
    opacity: 0.72,
  },
  todoCopy: {
    flex: 1,
    gap: 6,
  },
  todoTitle: {
    color: "#1d241d",
    fontSize: 16,
    fontWeight: "700",
  },
  todoTitleDone: {
    textDecorationLine: "line-through",
    color: "#5d675a",
  },
  todoMeta: {
    color: "#5d675a",
    fontSize: 13,
  },
  orderButtons: {
    flexDirection: "row",
    gap: 8,
  },
  actionWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  miniButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "rgba(36,23,15,0.06)",
  },
  miniButtonDanger: {
    backgroundColor: "rgba(157,59,50,0.12)",
  },
  miniButtonText: {
    color: "#1d241d",
    fontWeight: "600",
  },
  miniButtonTextDanger: {
    color: "#9d3b32",
  },
  emptyText: {
    color: "#5d675a",
    fontSize: 14,
    paddingVertical: 8,
  },
});
