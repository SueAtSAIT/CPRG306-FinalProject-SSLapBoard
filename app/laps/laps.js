"use client";
import { useEffect, useState } from "react";
import {
  HubConnection,
  HubConnectionBuilder,
  LogLevel,
} from "@microsoft/signalr";

const Laps = () => {
  const [connection, setConnection] = useState(null);
  const [connectionError, setConnectionError] = useState(null);

  useEffect(() => {
    let retryCount = 0;
    const connect = new HubConnectionBuilder()
      .withUrl("http://localhost:5237/hub")
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          retryCount = retryContext.previousRetryCount;
          if (retryContext.previousRetryCount > 5) {
            return null; // Stop retrying after 5 attempts
          }
          return Math.min(
            1000 * Math.pow(2, retryContext.previousRetryCount),
            30000
          );
        },
      })
      .configureLogging(LogLevel.Information)
      .build();

    setConnection(connect);
    connect
      .start()
      .then(() => {
        setConnectionError(null);
        connect.on("ReceiveMessage", (sender, content, sentTime) => {
          setMessages((prev) => [...prev, { sender, content, sentTime }]);
        });
        connect.invoke("RetrieveMessageHistory");
      })
      .catch((err) => {
        console.error("Error while connecting to SignalR Hub:", err);
        if (retryCount > 5) {
          setConnectionError("Unable to connect to timing server");
        } else {
          setConnectionError("Failed to connect to timing server");
        }
      });

    return () => {
      connect.off("ReceiveMessage");
      connect.stop();
    };
  }, []);

  // Optional: Render error message
  return <div>{connectionError && <p>{connectionError}</p>}</div>;
};
export default Laps;
