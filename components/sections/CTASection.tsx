"use client";

import { forwardRef } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";

interface CTASectionProps {
  // No props needed for now, but keeping for future extensibility
}

const CTASection = forwardRef<HTMLElement, CTASectionProps>(
  (props, ref) => {
    return (
      <section ref={ref} id="contact" className="py-12 sm:py-16 md:py-20 pb-32 md:pb-40 lg:pb-32 relative bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border border-primary/20 rounded-2xl p-6 sm:p-8 md:p-12 text-center shadow-xl backdrop-blur-sm">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">Ayo Collab!</h2>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 sm:mb-8 px-4">
              Tertarik pengen collab atau punya pertanyaan? Jangan ragu untuk menghubungi saya!
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <a
                href="mailto:joshua@example.com"
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <Mail className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Kirim Email</span>
              </a>
              <Link
                href="/blog"
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-card border border-border/50 text-foreground rounded-lg font-semibold hover:bg-accent/50 transition-all shadow-sm hover:shadow-md text-sm sm:text-base text-center"
              >
                Lihat Blog
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }
);

CTASection.displayName = "CTASection";

export default CTASection;
