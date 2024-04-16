"use client";
import { useState, useContext } from "react";
import { GlobalContext } from "@/app/contextProvider";
import Toast from "./Toast";
import SignIn from "./SignIn";
import SignOut from "./SignOut";
import { PROD_BASE_URL, LOCAL_BASE_URL } from "./utils";

export default function Home() {
  const [url, setURL] = useState("");
  const [loading, setLoading] = useState(false);
  const [comeptitorData, setCompetitorData] = useState("");
  const [notionPageCreated, setNotionPageCreated] = useState(false);
  const [showNoAuthToast, setShowNoAuthToast] = useState(false);
  const [addingPage, setAddingPage] = useState(false)
  const context = useContext(GlobalContext);

  function getScrapedData() {
    setLoading(true);
    let options = {
      method: "POST",
      body: JSON.stringify({ url: url.includes("https://") ? url : `https://${url}`}),
      headers: {
        "Content-Type": "application/json",
      },
    };

    fetch(`${PROD_BASE_URL}/scrape_website`, options)
      .then((data) => data.json())
      .then((resp) => {
        // console.log(resp);
        setCompetitorData(resp);
        setLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setLoading(true);
      });
  }

  function addToNotion() {
    setAddingPage(true)
    if (context.authenticated) {
      fetch(`${PROD_BASE_URL}/create_notion_page`, {
        method: "POST",
        body: JSON.stringify({ competitor_info: comeptitorData }),
        headers: { "Content-Type": "application/json" },
      })
        .then((data) => data.json())
        .then((resp) => {
          if (resp.message === "success") {
            setNotionPageCreated(true);
            setAddingPage(false)
          }
        });
    } else {
      setShowNoAuthToast(true);
      setAddingPage(false)
    }
  }

  return (
    <main className="min-h-screen w-screen flex flex-col gap-6 items-center pt-[40vh] pb-5">
      <SignIn />
      <SignOut />
      <h1 className="text-5xl font-bold">Competitor Research</h1>
      <section className="flex flex-col items-center justify-center gap-6">
        <div className="flex flex-row gap-2 items-center justify-center">
          <input
            onChange={(e) => {
              setURL(e.target.value);
            }}
            className="px-4 py-2 rounded-md bg-transparent text-white border-[1px] border-gray-500 w-96"
            type="text"
            placeholder="Enter the competitor's website (https://...)"
          />
          <button
            disabled={loading || url === ""}
            onClick={getScrapedData}
            className={`bg-white text-black py-2 px-4 rounded-md ${
              loading || url === "" ? "opacity-50" : "opacity-100"
            }`}
          >
            {loading ? "Loading..." : "Do Magic"}
          </button>
          <button
            onClick={addToNotion}
            disabled={comeptitorData === "" || addingPage ? true : false}
            className={`border-[1px] border-gray-500 px-4 py-2 rounded-md bg-transparent hover:bg-gray-900 duration-300 ${
              comeptitorData === "" || addingPage ? "opacity-50" : "opacity-100"
            }`}
          >
            {addingPage ? "adding..." : "Add to Notion"}
          </button>
        </div>
        {comeptitorData && (
          <pre className="max-w-prose text-wrap">{comeptitorData}</pre>
        )}
      </section>
      {notionPageCreated && (
        <Toast toast="Notion page created." type="success" />
      )}
      {showNoAuthToast && (
        <Toast toast="Please authenticate through notion first" type="error" />
      )}
    </main>
  );
}
