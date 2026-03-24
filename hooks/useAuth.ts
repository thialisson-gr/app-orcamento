// hooks/useAuth.ts
import { onAuthStateChanged, User } from "firebase/auth";
import { useEffect, useState } from "react";
import { auth } from "../services/firebase/config";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    // Fica vigiando o Firebase. Se logar ou deslogar, ele avisa o app na hora!
    const unsubscribe = onAuthStateChanged(auth, (usr) => {
      setUser(usr);
      setLoadingAuth(false);
    });

    return unsubscribe;
  }, []);

  return { user, loadingAuth };
}
