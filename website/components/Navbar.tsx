"use client";

import { useState, useEffect } from "react";
import { Menu, X, Download } from "lucide-react";
import Image from "next/image";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Guide", href: "#calculator-guide" },
  { label: "FAQ", href: "#faq" },
  { label: "Feedback", href: "#feedback" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const handleNavClick = () => setMobileOpen(false);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled && !mobileOpen
          ? "bg-[#09090B]/80 backdrop-blur-xl border-b border-border shadow-lg shadow-black/10 py-3"
          : mobileOpen
          ? "bg-[#09090B] border-b border-border/50 py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="mx-auto max-w-6xl px-5 flex items-center justify-between relative z-50">
        {/* Logo */}
        <a
          href="#"
          onClick={handleNavClick}
          className="flex items-center gap-2.5 group"
          aria-label="Rollcall Home"
        >
          <Image
            src="/logo/icon.png"
            alt="Rollcall Logo"
            width={36}
            height={36}
            className="rounded-lg transition-transform duration-200 group-hover:scale-105"
          />
          <span className="text-xl font-extrabold text-text-primary tracking-tight">
            Rollcall
          </span>
        </a>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors duration-200"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop CTA */}
        <a
          href="/download"
          className="hidden md:inline-flex items-center gap-2 bg-accent hover:bg-accent-soft text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-accent/25"
        >
          <Download size={16} />
          Download App
        </a>

        {/* Mobile Toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 text-text-secondary hover:text-text-primary transition-colors focus:outline-none"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <div
        className={`md:hidden fixed inset-0 w-screen h-screen bg-[#09090B] transition-all duration-300 z-40 flex flex-col justify-between px-6 pt-24 pb-12 overflow-y-auto ${
          mobileOpen
            ? "opacity-100 pointer-events-auto translate-y-0"
            : "opacity-0 pointer-events-none -translate-y-2"
        }`}
      >
        <div className="flex flex-col gap-4 items-center my-auto w-full max-w-sm mx-auto">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={handleNavClick}
              className="text-xl font-bold text-text-primary hover:text-accent transition-colors duration-200 py-2.5 w-full text-center rounded-xl hover:bg-bg-surface/60"
            >
              {link.label}
            </a>
          ))}
          <a
            href="/download"
            onClick={handleNavClick}
            className="w-full inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent-soft text-white text-base font-bold px-6 py-3.5 rounded-xl transition-all duration-200 shadow-lg shadow-accent/20 mt-4"
          >
            <Download size={20} />
            Download App
          </a>
        </div>
      </div>
    </header>
  );
}
