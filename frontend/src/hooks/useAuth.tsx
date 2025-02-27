import { useContext } from "react";
import AuthContext, { AuthContextType } from "../api/authProvider";

const useAuth = (): AuthContextType => {
  return useContext(AuthContext) as AuthContextType;
};

export default useAuth;
