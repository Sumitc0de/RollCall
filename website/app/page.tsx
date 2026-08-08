import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import WhyRollcall from "@/components/WhyRollcall";
import AppPreview from "@/components/AppPreview";
import AttendanceCalculatorContent from "@/components/AttendanceCalculatorContent";
import DownloadCTA from "@/components/DownloadCTA";
import FAQ from "@/components/FAQ";
import FeedbackForm from "@/components/FeedbackForm";
import Footer from "@/components/Footer";
import StructuredData from "@/components/StructuredData";

export default function Home() {
  return (
    <>
      <StructuredData />
      <Navbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <WhyRollcall />
        <AppPreview />
        <AttendanceCalculatorContent />
        <DownloadCTA />
        <FAQ />
        <FeedbackForm />
      </main>
      <Footer />
    </>
  );
}
