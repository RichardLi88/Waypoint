import axios from "axios";

export const defaultClient = axios.create({
  baseURL: "/",
});

export const privilegedClient = axios.create({
  baseURL: "/",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});
