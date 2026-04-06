import app from "./app.js";
import { initializeDatabase } from "./config/database.js";
import { PORT } from "./config/env.js";

await initializeDatabase();

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
