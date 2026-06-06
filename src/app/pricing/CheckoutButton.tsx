"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getDodoCheckoutUrl } from "@/app/actions/checkout";

interface CheckoutButtonProps extends React.ComponentPropsWithRef<"button"> {
  productId: string;
  userId: string | null;
  userEmail: string;
  text: string;
  className: string;
}

export function CheckoutButton({ 
  productId, 
  userId, 
  userEmail, 
  text, 
  className,
  ...props
}: CheckoutButtonProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  // Auto-trigger checkout if user just signed in/up and came back with autoCheckout param
  useEffect(() => {
    const autoCheckout = searchParams.get("autoCheckout");
    if (autoCheckout === productId && userId) {
      getDodoCheckoutUrl(productId, userId, userEmail).then((checkoutUrl) => {
        if (checkoutUrl) window.location.href = checkoutUrl;
      });
    }
  }, []);

  const handleCheckout = async () => {
    if (!userId) {
      router.push(`/sign-up?redirect_url=/pricing?autoCheckout=${productId}`);
      return;
    }

    try {
      setLoading(true);
      const checkoutUrl = await getDodoCheckoutUrl(productId, userId, userEmail);
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        alert("Error creating payment session. Please try again.");
        setLoading(false);
      }
    } catch (error) {
      console.error("Checkout error:", error);
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className={`${className} ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
      {...props}
    >
      {loading ? "REDIRECTING..." : text}
    </button>
  );
}