import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { deleteTodo, updateTodo } from "../controllers/todoController.js";

const router = express.Router();

/**
 * @swagger
 * /api/todos/{todoId}:
 *   patch:
 *     summary: Update a todo
 *     description: Update a todo's task text, completion state, or both.
 *     tags:
 *       - Todos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: todoId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTodoRequest'
 *     responses:
 *       200:
 *         description: Todo updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TodoResponse'
 */
router.patch("/:todoId", authMiddleware, updateTodo);

/**
 * @swagger
 * /api/todos/{todoId}:
 *   delete:
 *     summary: Delete a todo
 *     description: Delete a todo from one of the authenticated user's lists.
 *     tags:
 *       - Todos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: todoId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Todo deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 */
router.delete("/:todoId", authMiddleware, deleteTodo);

export default router;
