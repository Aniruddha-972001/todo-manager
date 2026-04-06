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
