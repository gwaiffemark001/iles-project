import { useContext } from "react";
import AuthContext from "./AuthContextInstance";

export const useAuth = () => {
  return useContext(AuthContext);
};