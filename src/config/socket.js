import { Server } from "socket.io";
import { verifyToken } from "../utils/jwt.js";
import * as billRepo from "../repositories/billRepo.js";

let io;
export const initSocketIO = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  io.use(async (socket, next) => {
    if (socket.handshake.auth.jwt) {
      const token = socket.handshake.auth.jwt;
      try {
        const decoded = verifyToken(token);
        socket.data.merchant = decoded;
        next();
      } catch (err) {
        next(new Error("Unauthorized"));
      }
    } else if (
      socket.handshake.auth.billId ||
      socket.handshake.auth.billToken
    ) {
      if (!socket.handshake.auth.billId) {
        return next(new Error("Bill ID is needed"));
      } else if (!socket.handshake.auth.billToken) {
        return next(new Error("Token is needed is needed"));
      }
      const { billId, billToken } = socket.handshake.auth;
      const bill = await billRepo.findBill({ billId, token: billToken });
      if (!bill) {
        return next(new Error("Unauthorized"));
      }
      socket.data.billId = billId;
      socket.data.token = billToken;
      return next();
    } else {
      return next(new Error("Authentication required"));
    }
  });
  io.on("connection", (socket) => {
    if (socket.data.billId) {
      socket.join(`bill:${socket.data.billId}`);
    } else if (socket.data.merchant) {
      socket.on("subscribe:bill", async (billId) => {
        const bill = await billRepo.findBillById(billId);
        if (!bill || bill.merchant_id !== socket.data.merchant.id) {
          return socket.emit("error", "Not you bill");
        }
        socket.join(`bill:${billId}`);
      });
    }
  });
};

export const getIO = () => {
  if (!io) throw new Error("Socket not initialized");
  return io;
};
