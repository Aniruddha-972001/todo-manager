import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { lists, todos } from "../data/store.js";

const router = express.Router();

// get all lists
router.get("/", authMiddleware, (req, res) => {
    return res.status(200).json({
        message: "Lists fetched successfully",
        lists: lists
      });
});

/*
Client sends list name
↓
authMiddleware verifies token
↓
req.user is available
↓
server creates new list
↓
creatorId comes from req.user.userId
↓
push into lists array
↓
return 201 response
*/
router.post("/", authMiddleware, (req,res) => {
    const {name} = req.body;

    if(!name){
        return res.status(400).json({
            message:"List name is required",
        });
    }

    const newList = {
        id: crypto.randomUUID(),
        name,
        creatorId: req.user.userId,
    };
    lists.push(newList);
    console.log("req.user:", req.user);
    console.log("new list:", newList);
    console.log("all lists:", lists);

    return res.status(201).json({
        message:"List created successfully",
        list: newList,
    });
});

/*
Read list id from params
↓
Read new name from body
↓
Find the list
↓
If list not found → 404
↓
If creatorId !== req.user.userId → 403
↓
Update name
↓
Return updated list
*/
router.patch("/:id", authMiddleware, (req,res) => {
    const {id} = req.params;


    const {name} = req.body;
    if(!name){
        return res.status(400).json({
            message:"List name is required",
        });
    }

    const list = lists.find((l) => l.id === id);
    if(!list){
        return res.status(404).json({
            message:"List Not Found",
        });
    }

    if(list.creatorId !== req.user.userId){
        return res.status(403).json({
            message: "Forbidden: you can only update your own list",
        });
    }

    list.name = name;
    console.log("req.user:", req.user);
    console.log("list found:", list);
    
    return res.status(200).json({
        message: "List Updated Successfully",
        list,
    });
});

/*
Get listId from params
↓
Get task from body
↓
Find list
↓
If not found → 404
↓
If not owner → 403
↓
Create todo
↓
Push to todos array
↓
Return response
*/
router.post("/:id/todos", authMiddleware, (req,res) => {
    const {id} = req.params;
    const {task} = req.body;

    if(!task){
        return res.status(400).json({
            message:"Task is Required",
        });
    }
    const list = lists.find((l) => l.id === id);

    if(!list){
        return res.status(404).json({
            message:"List not found",
        });
    }

    if(list.creatorId !== req.user.userId){
        return res.status(403).json({
            message:"Forbidden : you can only add todos to your own list",
        });
    }

    const newTodo = {
        id: crypto.randomUUID(),
        task,
        completed: false,
        listId:id,
    };
    todos.push(newTodo);
    console.log(todos);

    return res.status(201).json({
        message: "Todo added successfully",
        todo: newTodo,
    });
});


export default router;