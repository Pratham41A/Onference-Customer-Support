import "dotenv/config"
import express from "express";
import cors from "cors";
import router from "./routes.js";
import { connectMongoDb } from "./mongoDb.js";
import { refreshSubscription } from "./services.js";
import { scheduler } from "./scheduler.js";
import { Server } from "socket.io";
import http from 'http'
import cookieParser from 'cookie-parser';

const app = express();
app.use(cookieParser());
app.use(express.json());
app.use(cors({ origin: process.env.FRONTEND.split(","),credentials: true }));
app.use("/", router);

const server = http.createServer(app);

export const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND.split(","),
    credentials: true
  }
})
io.on("connection", (socket) => {
  console.log("Socket Connection : ", socket.id);

  socket.on("disconnect", () => {
    console.log("Socket Disconnection : ", socket.id);
  });
});


server.listen(process.env.PORT, async () => {
  await connectMongoDb();
  await refreshSubscription();
  scheduler();
  console.log(`✅ Server  ${process.env.PORT}`);
});
