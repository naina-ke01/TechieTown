import Payment from "../models/paymentModel.js";
import fs from "fs";

export const getCallbacks = async (req, res) => {
  try {
    const logs = JSON.parse(fs.readFileSync("./mpesa-callbacks.json", "utf8"));
    res.json(logs);
  } catch {
    res.json([]);
  }
};
