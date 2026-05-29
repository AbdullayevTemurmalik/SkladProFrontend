import axios from "axios";

const api = axios.create({
  baseURL:
    "postgresql://postgres:LZhmLnBOdZCQeSgndLoGpVedSjPObEjQ@zephyr.proxy.rlwy.net:42668/railway",
});

export default api;
