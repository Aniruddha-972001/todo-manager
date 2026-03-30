import express from "express";
import authRoutes from "./routes/auth.js";
import listRoutes from "./routes/lists.js";
import cookieParser from "cookie-parser";


const app = express();
const PORT = 3000;

// middleware
app.use(express.json());

// for refresh token 
app.use(cookieParser());

app.get("/",(req,res)=>{
    res.json({message: "Server is running "});
});

// mounting routes 
app.use("/api",authRoutes);
app.use("/api/lists",listRoutes);

//start server
app.listen(PORT,() =>{
    console.log(`Server running on http://localhost:${PORT}`);
});
