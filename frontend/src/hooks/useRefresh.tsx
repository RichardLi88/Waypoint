import { defaultClient } from "../api/axiosClient";
import useAuth from "./useAuth";
import { Session } from "../api/authProvider";

const useRefresh = () => {
  const { setSession } = useAuth();

  const refresh = async () => {
    const response = await defaultClient.get("/api/auth/refresh", {
      withCredentials: true,
    });

    setSession((prev: Session) => {
      return { ...prev, accessToken: response.data.accessToken };
    });

    return response.data.accessToken;
  };

  return refresh;
};

export default useRefresh;
