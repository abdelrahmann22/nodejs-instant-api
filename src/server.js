import http from "http";

import { initSocketIO } from "./config/socket.js";
import app from "./app.js";
import { connectDB } from "./config/db.js";
connectDB();

const server = http.createServer(app);

initSocketIO(server);
const port = process.env.PORT || 3000;

server.listen(port, () => {
  console.log(`Server is running: ${port}`);
});

export default app;
