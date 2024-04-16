"use client";

import { useEffect, useState, useContext } from "react";
import { v4 as uuidv4 } from "uuid";
import Toast from "./Toast";
import Link from "next/link";
import { GlobalContext } from "@/app/contextProvider";
import { PROD_BASE_URL } from "./utils";

export default function Authenticate() {
  const [authURL, setAuthURL] = useState("");
  // const [authenticated, setAuthenticated] = useState<boolean>();
  const context = useContext(GlobalContext)

  useEffect(() => {
    if (!localStorage.getItem("entity_id")) {
      let entity_id = uuidv4();
      localStorage.setItem("entity_id", entity_id.toString());
    }
  }, []);

  useEffect(() => {
    let entity_id = localStorage.getItem("entity_id");
    if (!authURL) {
      const interval = setInterval(() => {
        fetch(
          `${PROD_BASE_URL}/confirm_auth?entity_id=${entity_id?.toString()}`
        )
          .then((data) => data.json())
          .then((resp: any) => {
            console.log(resp);
            context.setAuthenticated(resp.auth_confirmation);
            if (resp) {
            }
            clearInterval(interval);
          })
          .catch((err) => {
            console.log(err);
            clearInterval(interval);
          });
      }, 1000);
    }
  }, [authURL]);

  useEffect(() => {
    const openLinkInNewTab = () => {
      const url = authURL;
      const newTab = window.open(url, "_blank");
      newTab?.focus();
    };
    if (authURL !== "") {
      openLinkInNewTab();
    }
  }, [authURL]);

  function notionAuth() {
    let entity_id = localStorage.getItem("entity_id");
    console.log(context);
    fetch(
      `${PROD_BASE_URL}/authenticate?entity_id=${entity_id?.toString()}`
    )
      .then((data) => data.json())
      .then((resp) => {
        if (resp.message === "error") {
          context.setAuthenticated(true);
        } else {
          // console.log("asf");
          setAuthURL(resp.URL);
        }
      })
      .catch((err) => {
        console.log(err);
      });
  }
  return (
    <main className="w-screen min-h-screen flex flex-col gap-5 items-center justify-center">
      <button
        disabled={authURL !== "" ? true : false}
        className={`bg-white text-black font-semibold font-raleway py-2 px-4 rounded-md ${
          authURL !== "" ? "opacity-50" : "opacity-100"
        }`}
        onClick={notionAuth}
      >
        Authentiate with Notion
      </button>
      <Link
        href={"/"}
        className={`border-[1px] border-gray-500 px-4 py-2 rounded-md bg-transparent hover:bg-gray-900 duration-300`}
      >
        Proceed to Homepage
      </Link>
      {context.authenticated && <Toast toast="Already authenticated" type="success" />}
    </main>
  );
}
