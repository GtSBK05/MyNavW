// web/pages/index.js
import { useEffect, useState } from "react";
import AuthPanel from "@/components/AuthPanel";
import TodoPanel from "@/components/TodoPanel";

export default function Home() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("mynavw_user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        // ignore
      }
    }
  }, []);

  if (!user) {
    return <AuthPanel onAuth={setUser} />;
  }

  return <TodoPanel user={user} onLogout={() => setUser(null)} />;
}
