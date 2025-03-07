import React, { createContext, useState, ReactNode } from "react";
// uses context to store authentication so that user details can be passed to all components

export type Session = {
  username: string | null;
  role: string | null;
  name: string | null;
  accessToken: string | null;
};

export interface AuthContextType {
  session?: Session;
  setSession: React.Dispatch<React.SetStateAction<Session>>;
}

const AuthContext = createContext({});
 
export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [session, setSession] = useState<Session>({
    username: null,
    role: null,
    name: null,
    accessToken: null,
  });

  return (
    <AuthContext.Provider value={{ session, setSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
