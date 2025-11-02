import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { TicketGrid } from "@/components/TicketGrid";
import { Footer } from "@/components/Footer";
import { Toaster } from "@/components/ui/toaster";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <TicketGrid />
      </main>
      <Footer />
      <Toaster />
    </div>
  );
}
