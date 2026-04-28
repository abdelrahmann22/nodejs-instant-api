import app from "./app.js";
import { connectDB } from "./config/db.js";

const port = process.env.PORT || 3000;

app.listen(port, async () => {
  await connectDB();
  console.log(`Server is running: ${port}`);
});
