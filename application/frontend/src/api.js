import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000",
});

// control endpoints
export const startDetection = () => API.post("/start");
export const stopDetection = () => API.post("/stop");
