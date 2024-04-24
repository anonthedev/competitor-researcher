"use client";
import { useState, useContext, useEffect } from "react";
import { GlobalContext } from "@/app/contextProvider";
import Toast from "./Toast";
import SignIn from "./SignIn";
import SignOut from "./SignOut";
import { BASE_URL } from "./utils";

export default function Home() {
  const [url, setURL] = useState("");
  const [loading, setLoading] = useState(false);
  const [comeptitorData, setCompetitorData] = useState("");
  const [notionPageCreated, setNotionPageCreated] = useState(false);
  const [showNoAuthToast, setShowNoAuthToast] = useState(false);
  const [addingPage, setAddingPage] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const context = useContext(GlobalContext);

  const [logs, setLogs] = useState<any[]>([]);

  // const formatText = (text) => {
  //   const lines = text.split("\n");

  //   return lines.map((line, index) => {
  //     if (line.trim() === "") {
  //       return <br key={index} />;
  //     } else {
  //       let formattedLine = line.replace(/\\'/g, "'"); // Replace \\' with '
  //       formattedLine = formattedLine.replace(
  //         /\\\*(.*?)\\\*/g,
  //         "<strong>$1</strong>"
  //       ); // Wrap \\\'something\\\' in <strong> tags

  //       try {
  //         const jsonObject = JSON.parse(formattedLine);
  //         return <pre key={index}>{JSON.stringify(jsonObject, null, 2)}</pre>; // Render JSON nicely
  //       } catch (error) {
  //         return (
  //           <p
  //             key={index}
  //             dangerouslySetInnerHTML={{ __html: formattedLine }}
  //           />
  //         );
  //       }
  //     }
  //   });
  // };

  function getScrapedData() {
    setLoading(true);
    setCompetitorData("")
    let options = {
      method: "POST",
      body: JSON.stringify({
        url: url.includes("https://") ? url : `https://${url}`,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    };

    fetch(`${BASE_URL}/scrape_website`, options)
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
    setAddingPage(true);
    setLogs([])
    if (context.authenticated) {
      const eventSource = new EventSource(`${BASE_URL}/create_notion_page`);
      eventSource.onmessage = function (event) {
        const logData = event.data.replace("data: ", "");

        const lines = logData.slice(2, -1).split("\n");

        setLogs((prevLogs) => [...prevLogs, ...lines]);

        if (logData.includes("AgentFinish")) {
          console.log("hello");
          eventSource.close();
          setNotionPageCreated(true);
          setAddingPage(false);
        }
      };
      eventSource.onerror = (event) => {
        console.error("EventSource failed", event);
        setNotionPageCreated(false);
        setAddingPage(false);
      };
    } else {
      setShowNoAuthToast(true);
      setAddingPage(false);
    }
  }

  // console.log(logs)

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
            className={`border-[1px] border-gray-500 px-4 py-2 rounded-md bg-transparent hover:bg-gray-900 duration-300 ${comeptitorData === "" || addingPage ? "opacity-50" : "opacity-100"}`}
          >
            {addingPage ? "Adding..." : "Add to Notion"}
          </button>
        </div>

        {logs.length !== 0 && (
          <>
            <div
              className="flex flex-row self-start gap-2 cursor-pointer"
              onClick={() => {
                setShowLogs(!showLogs);
              }}
            >
              {showLogs ? (
                <p>&#x25BC;</p>
              ) : (
                <p className="rotate-90">&#x25B2;</p>
              )}
              {showLogs ? "Hide Logs" : "Show Logs"}
            </div>
            <pre
              className={`${
                showLogs ? "block" : "hidden"
              } max-w-prose text-wrap max-h-48 overflow-y-auto`}
            >
              {logs}
            </pre>
          </>
        )}
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
