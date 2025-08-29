import axios, { AxiosInstance } from "axios";

const _axios: AxiosInstance = axios.create();

const HttpMethods = {
  GET: "GET",
  POST: "POST",
  DELETE: "DELETE",
};

const getAxiosClient = () => _axios;

export const HttpService = {
  HttpMethods,
  getAxiosClient,
};
