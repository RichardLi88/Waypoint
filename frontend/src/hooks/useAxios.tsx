import { privilegedClient } from "../api/axiosClient";
import useRefresh from "./useRefresh";
import useAuth from "./useAuth";
import { useEffect } from "react";

const useAxios = () => {
  const refresh = useRefresh();
  const { session } = useAuth();

  useEffect(() => {
    const requestIntercept = privilegedClient.interceptors.request.use(
      (config) => {
        if (!config.headers["Authorization"]) {
          config.headers["Authorization"] = `Bearer ${session?.accessToken}`;
        }
        return config;
      },
      (err) => Promise.reject(err),
    );

    const responseIntercept = privilegedClient.interceptors.response.use(
      (response) => response,
      async (err) => {
        const prevReq = err?.config;
        if (err?.response.status === 403 && !prevReq?.sent) {
          prevReq.sent = true;
          const newAccessToken = await refresh();
          prevReq.headers["Authorization"] = `Bearer ${newAccessToken}`;
          return privilegedClient(prevReq);
        }
        return Promise.reject(err);
      },
    );

    return () => {
      privilegedClient.interceptors.request.eject(requestIntercept);
      privilegedClient.interceptors.response.eject(responseIntercept);
    };
  }, [session, refresh]);

  return privilegedClient;
};

export default useAxios;
