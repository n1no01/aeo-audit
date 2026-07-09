import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserStats } from "../../actions";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import AcademyDashboardClient from "./AcademyDashboardClient";

// Prisilno učitavanje svježih podataka pri svakom refreshu stranice
export const dynamic = "force-dynamic"; 

export default async function CertificationDashboard() {
  const { userId } = await auth();

  // Sigurnosna kočnica 1: Ako uopšte nije ulogovan, vrati ga nazad
  if (!userId) {
    redirect("/academy");
  }

  const stats = await getUserStats();

  // Sigurnosna kočnica 2: Ako je ulogovan ali u bazi nema oznaku da je platio
  if (!stats || !stats.aeo_academy_paid) {
    redirect("/academy");
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col justify-between relative">
      <Navbar userId={userId} />

      <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-12 flex-1 relative z-10">
        
        {/* Prosleđujemo sve spremne podatke direktno u klijentski interfejs */}
        <AcademyDashboardClient 
          userId={userId} 
          attemptsUsed={stats.exam_attempts_used || 0} 
          hasPassed={stats.exam_passed || false} 
        />

      </main>

      <Footer />
    </div>
  );
}