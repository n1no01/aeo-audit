"use client";

import { useState } from "react";

interface CheckoutButtonProps {
  finalUrl: string;
  text: string;
  className: string;
}

export function CheckoutButton({ finalUrl, text, className }: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <button
      onClick={() => {
        setIsLoading(true);
        window.location.href = finalUrl;
      }}
      disabled={isLoading}
      className={`${className} disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {isLoading ? "REDIRECTING..." : text}
    </button>
  );
}