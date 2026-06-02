import axios from "axios";

const api = axios.create({
  baseURL: "https://skladprobackend-production.up.railway.app/",
});

export default api;
