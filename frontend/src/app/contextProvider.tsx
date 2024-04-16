"use client";

import { PROD_BASE_URL, LOCAL_BASE_URL } from "@/components/utils";
import { createContext, useEffect, useState } from "react";

export const GlobalContext = createContext<any>(null);

export default function ContextProvider({ children }: { children: any }) {
  const [authenticated, setAuthenticated] = useState<boolean>();
  useEffect(()=>{
    if (!localStorage.getItem("entity_id")) {
        setAuthenticated(false)
    } else {
        let entity_id = localStorage.getItem("entity_id")
        fetch(`${PROD_BASE_URL}/confirm_auth?entity_id=${entity_id}`)
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
