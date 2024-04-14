"use client";

import { createContext, useEffect, useState } from "react";

export const GlobalContext = createContext<any>(null);

export default function ContextProvider({ children }: { children: any }) {
  const [authenticated, setAuthenticated] = useState<boolean>();
  useEffect(()=>{
    if (!localStorage.getItem("entity_id")) {
        setAuthenticated(false)
    } else {
        let entity_id = localStorage.getItem("entity_id")
        fetch(`http://127.0.0.1:5000/confirm_auth?entity_id=${entity_id}`)
        .then((data)=>data.json())
        .then((resp)=>{
            setAuthenticated(resp.auth_confirmation)
        })
    }
  }, [])

  return (
    <GlobalContext.Provider
      value={{
        authenticated,
        setAuthenticated,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
}
