import React from "react";

export function EiPlus(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={25}
      height={25}
      viewBox="0 0 50 50"
      {...props}>
      <path
        fill="#959595"
        d="M25 42c-9.4 0-17-7.6-17-17S15.6 8 25 8s17 7.6 17 17s-7.6 17-17 17m0-32c-8.3 0-15 6.7-15 15s6.7 15 15 15s15-6.7 15-15s-6.7-15-15-15"></path>
      <path fill="#959595" d="M16 24h18v2H16z"></path>
      <path fill="#959595" d="M24 16h2v18h-2z"></path>
    </svg>
  );
}
