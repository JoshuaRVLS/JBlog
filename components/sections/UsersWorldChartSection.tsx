"use client";

import dynamic from "next/dynamic";
import TextReveal from "@/components/TextReveal";
import SectionTitle from "@/components/SectionTitle";
import { Globe } from "lucide-react";

// Lazy load heavy chart component
const UsersWorldChart = dynamic(() => import("@/components/UsersWorldChart"), {
  loading: () => (
    <div className="w-full h-96 bg-muted/30 rounded-lg flex items-center justify-center">
      <div className="text-muted-foreground text-sm">Loading chart...</div>
    </div>
  ),
  ssr: false,
});

export default function UsersWorldChartSection() {
  return (
    <section className="py-16 sm:py-24 md:py-32 relative overflow-hidden bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <TextReveal delay={0} direction="up">
          <SectionTitle
            title="Users dari Seluruh Dunia"
            subtitle="Global Reach"
            icon={Globe}
            align="center"
            className="px-4"
          />
        </TextReveal>
        <TextReveal delay={0.2} direction="up">
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-8 sm:mb-12 text-center max-w-2xl mx-auto px-4">
            Lihat distribusi pengguna JBlog dari berbagai negara di seluruh dunia.
          </p>
        </TextReveal>
        <TextReveal delay={0.4} direction="up">
          <UsersWorldChart className="max-w-4xl mx-auto" />
        </TextReveal>
      </div>
    </section>
  );
}
