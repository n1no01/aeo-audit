"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getDodoCheckoutUrl } from "@/app/actions/checkout";

// Proširujemo interfejs tako da prihvata sve standardne HTML atribute za button (uključujući aria-label)
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
  ...props // 👈 Hvata sve preostale proslijeđene atribute poput aria-label
}: CheckoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    // 1. Ako korisnik nije ulogovan, šaljemo ga na Clerk sign-up
    if (!userId) {
      router.push("/sign-up?redirect_url=/pricing");
      return;
    }

    try {
      setLoading(true);
      
      // 2. Pozivamo našu bezbjednu Fetch akciju tek na klik!
      const checkoutUrl = await getDodoCheckoutUrl(productId, userId, userEmail);

      if (checkoutUrl) {
        // 3. 🚨 PREUSMJERAVANJE: Šaljemo browser direktno na generisani Dodo link
        window.location.href = checkoutUrl;
      } else {
        alert("Greška pri kreiranju sesije za plaćanje. Pokušajte ponovo.");
        setLoading(false);
      }
    } catch (error) {
      console.error("Checkout click error:", error);
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className={`${className} ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
      {...props} // 👈 Automatski lijepi aria-label direktno na HTML <button> tag u browseru
    >
      {loading ? "REDIRECTING..." : text}
    </button>
  );
}