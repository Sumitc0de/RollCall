import Image from "next/image";

const footerLinks = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Calculator Guide", href: "#calculator-guide" },
  { label: "FAQ", href: "#faq" },
  { label: "Feedback", href: "#feedback" },
  { label: "Download", href: "/download" },
];

export default function Footer() {
  return (
    <footer className="border-t border-border py-12 px-5">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8">
          {/* Brand */}
          <div className="flex flex-col items-center md:items-start gap-3">
            <div className="flex items-center gap-2.5">
              <Image
                src="/logo/icon.png"
                alt="Rollcall Logo"
                width={28}
                height={28}
                className="rounded-lg"
              />
              <span className="text-lg font-extrabold text-text-primary">
                Rollcall
              </span>
            </div>
            <p className="text-sm text-text-muted max-w-xs text-center md:text-left">
              Simple, offline-first attendance tracking for students. Free and open-source.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {footerLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Developer credit */}
          <div className="flex flex-col items-center md:items-end gap-2">
            <a
              href="https://github.com/sumitc0de"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-text-muted hover:text-accent transition-colors"
            >
              Built by <span className="font-bold text-text-secondary">sumitc0de</span>
            </a>
            <a
              href="https://sumitxdev.online"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-text-muted hover:text-accent transition-colors"
            >
              sumitxdev.online
            </a>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-8 pt-6 border-t border-border text-center">
          <p className="text-xs text-text-muted">
            © {new Date().getFullYear()} Rollcall. Developed by sumitc0de
          </p>
        </div>
      </div>
    </footer>
  );
}
