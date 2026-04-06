import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("user can sign up, log in, create a list, add a todo, and complete it", async ({ page }) => {
  const uniqueId = Date.now();
  const username = `e2e_user_${uniqueId}`;
  const password = "secret123";
  const listName = "Launch Checklist";
  const todoTask = "Mark the first task complete";

  await page.getByRole("button", { name: "Sign up" }).click();
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("button", { name: "Log in" })).toBeVisible();

  await page.getByRole("button", { name: "Log in" }).click();
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Enter workspace" }).click();

  await expect(page.getByRole("heading", { name: "Workspace overview" })).toBeVisible();

  await page.getByLabel("Create a new list").fill(listName);
  await page.getByRole("button", { name: "Add list" }).click();

  await expect(page.getByRole("heading", { name: listName })).toBeVisible();

  await page.getByLabel("New todo").fill(todoTask);
  await page.getByRole("button", { name: "Add todo" }).click();

  await expect(page.getByText(todoTask)).toBeVisible();

  const todoCard = page.locator(".todo-card").filter({ hasText: todoTask });
  await todoCard.getByRole("checkbox").click();

  await expect(todoCard.getByText("Completed task")).toBeVisible();
  await expect(page.getByText("1/1")).toBeVisible();
});

test("user can manage priorities, due dates, views, and ordering from the workspace", async ({ page }) => {
  const uniqueId = Date.now();
  const username = `e2e_filters_${uniqueId}`;
  const password = "secret123";

  await page.getByRole("button", { name: "Sign up" }).click();
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await page.getByRole("button", { name: "Log in" }).click();
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Enter workspace" }).click();

  await page.getByLabel("Create a new list").fill("Editing Board");
  await page.getByRole("button", { name: "Add list" }).click();
  await expect(page.getByRole("heading", { name: "Editing Board" })).toBeVisible();

  await page.getByLabel("New todo").fill("Draft launch announcement");
  await page.locator('select').nth(0).selectOption("high");
  await page.locator('input[type="date"]').nth(0).fill("2026-04-15");
  await page.getByRole("button", { name: "Add todo" }).click();
  await expect(page.getByText("Draft launch announcement")).toBeVisible();
  await page.getByLabel("New todo").fill("Review onboarding copy");
  await page.locator('select').nth(0).selectOption("low");
  await page.locator('input[type="date"]').nth(0).fill("");
  await page.getByRole("button", { name: "Add todo" }).click();
  await expect(page.getByText("Review onboarding copy")).toBeVisible();
  await page.getByLabel("New todo").fill("Polish release notes");
  await page.locator('select').nth(0).selectOption("medium");
  await page.getByRole("button", { name: "Add todo" }).click();
  await expect(page.getByText("Polish release notes")).toBeVisible();

  const firstTodo = page.locator(".todo-card").nth(0);
  await expect(firstTodo).toContainText("Draft launch announcement");
  await expect(firstTodo).toContainText("high");
  await expect(firstTodo).toContainText("Due 2026-04-15");

  await firstTodo.getByRole("button", { name: "Edit" }).click();
  await firstTodo.locator(".todo-inline-input").fill("Draft launch copy");
  await firstTodo.locator("select").selectOption("medium");
  await firstTodo.locator('input[type="date"]').fill("2026-04-20");
  await firstTodo.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Draft launch copy")).toBeVisible();
  const editedTodo = page.locator(".todo-card").filter({ hasText: "Draft launch copy" });
  await expect(editedTodo).toContainText("medium");
  await expect(editedTodo).toContainText("Due 2026-04-20");

  await page.getByLabel("Search todos").fill("launch");
  await expect(page.getByText("Draft launch copy")).toBeVisible();
  await expect(page.getByText("Review onboarding copy")).not.toBeVisible();

  await page.getByRole("button", { name: "All" }).click();
  await page.getByLabel("Search todos").fill("");

  const thirdTodo = page.locator(".todo-card").filter({ hasText: "Polish release notes" });
  await thirdTodo.dragTo(editedTodo);
  await expect(page.locator(".todo-card").nth(0)).toContainText("Polish release notes");

  const secondTodo = page.locator(".todo-card").filter({ hasText: "Review onboarding copy" });
  await secondTodo.getByRole("checkbox").click();
  await page.getByRole("button", { name: "Completed" }).click();
  await expect(page.getByText("Review onboarding copy")).toBeVisible();
  await expect(page.getByText("Draft launch copy")).not.toBeVisible();

  await page.getByRole("button", { name: "Open", exact: true }).click();
  await expect(page.getByText("Draft launch copy")).toBeVisible();
  await editedTodo.getByRole("button", { name: "Archive" }).click();
  await page.getByRole("button", { name: "Archived" }).click();
  await expect(page.getByText("Draft launch copy")).toBeVisible();
  await expect(page.getByText("Review onboarding copy")).not.toBeVisible();

  const archivedTodo = page.locator(".todo-card").filter({ hasText: "Draft launch copy" });
  await archivedTodo.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText("Draft launch copy")).not.toBeVisible();

  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page.getByRole("heading", { name: "Access your workspace." })).toBeVisible();
});
