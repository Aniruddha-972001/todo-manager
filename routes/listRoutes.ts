import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  createList,
  createTodo,
  deleteList,
  getList,
  getListTodos,
  getLists,
  reorderTodosInList,
  updateList,
} from "../controllers/listController.js";

const router = express.Router();

/**
 * @swagger
 * /api/lists:
 *   get:
 *     summary: Get all lists
 *     description: Returns only the authenticated user's lists from the database.
 *     tags:
 *       - Lists
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lists fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ListsResponse'
 */
router.get("/", authMiddleware, getLists);

/**
 * @swagger
 * /api/lists/{id}:
 *   get:
 *     summary: Get one list and its todos
 *     description: Returns a single list owned by the authenticated user, along with its todos.
 *     tags:
 *       - Lists
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: List id
 *     responses:
 *       200:
 *         description: List fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ListWithTodosResponse'
 *       404:
 *         description: List not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/:id", authMiddleware, getList);

/**
 * @swagger
 * /api/lists:
 *   post:
 *     summary: Create a new list
 *     description: Creates a list owned by the currently authenticated user.
 *     tags:
 *       - Lists
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateListRequest'
 *     responses:
 *       201:
 *         description: List created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ListResponse'
 *       400:
 *         description: Missing list name
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/", authMiddleware, createList);

/**
 * @swagger
 * /api/lists/{id}:
 *   patch:
 *     summary: Update an existing list name
 *     description: Only the creator of the list can rename it.
 *     tags:
 *       - Lists
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: List id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateListRequest'
 *     responses:
 *       200:
 *         description: List updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ListResponse'
 *       403:
 *         description: User is not the owner of the list
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: List not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch("/:id", authMiddleware, updateList);

/**
 * @swagger
 * /api/lists/{id}:
 *   delete:
 *     summary: Delete a list
 *     description: Deletes one of the authenticated user's lists and its todos.
 *     tags:
 *       - Lists
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *       404:
 *         description: List not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete("/:id", authMiddleware, deleteList);

/**
 * @swagger
 * /api/lists/{id}/todos:
 *   get:
 *     summary: Get all todos for a list
 *     description: Returns all todos for one of the authenticated user's lists.
 *     tags:
 *       - Todos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Todos fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ListTodosResponse'
 */
router.get("/:id/todos", authMiddleware, getListTodos);

/**
 * @swagger
 * /api/lists/{id}/todos:
 *   post:
 *     summary: Add a todo to a list
 *     description: Only the creator of the list can add todos to it.
 *     tags:
 *       - Todos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: List id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTodoRequest'
 *     responses:
 *       201:
 *         description: Todo added successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TodoResponse'
 *       403:
 *         description: User is not the owner of the list
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: List not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/:id/todos", authMiddleware, createTodo);

/**
 * @swagger
 * /api/lists/{id}/todos/reorder:
 *   post:
 *     summary: Reorder todos within a list
 *     description: Persists a new drag-and-drop order for all todos in one of the authenticated user's lists.
 *     tags:
 *       - Todos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: List id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReorderTodosRequest'
 *     responses:
 *       200:
 *         description: Todos reordered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 */
router.post("/:id/todos/reorder", authMiddleware, reorderTodosInList);

export default router;
