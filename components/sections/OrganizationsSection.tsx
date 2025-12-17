"use client";

import { forwardRef } from "react";
import Image from "next/image";
import ShimmerCard from "@/components/ShimmerCard";
import SectionTitle from "@/components/SectionTitle";
import { Users } from "lucide-react";

interface GitHubOrg {
  id: number;
  login: string;
  avatar_url: string;
  description: string | null;
  html_url: string;
}

interface OrganizationsSectionProps {
  organizations: GitHubOrg[];
}

const OrganizationsSection = forwardRef<HTMLElement, OrganizationsSectionProps>(
  ({ organizations }, ref) => {
    return (
      <section ref={ref} id="organizations" className="py-12 sm:py-16 md:py-20 bg-background relative" style={{ opacity: 1 }}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <SectionTitle
            title="Organisasi"
            subtitle="Communities"
            icon={Users}
            align="center"
            className="px-4"
          />
          {/* ABINARA-1 Featured Section */}
          <div className="mb-16 sm:mb-20 md:mb-24">
            <div className="max-w-4xl mx-auto">
              <ShimmerCard delay={0} className="org-card text-center group overflow-hidden relative">
                <a
                  href="https://www.linkedin.com/company/abinara-1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-8 sm:p-10 md:p-12"
                >
                  <div className="mb-8">
                    <Image
                      src="https://media.licdn.com/dms/image/v2/C560BAQEBqCtlGqtU2Q/company-logo_200_200/company-logo_200_200/0/1638160684744?e=2147483647&v=beta&t=xMwAxJxGACmsAT9zdQEy8NCyWYCPMOM-eFTX2za2f8s"
                      alt="ABINARA-1"
                      width={100}
                      height={100}
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-full mx-auto mb-6 group-hover:scale-110 transition-transform object-cover border-2 border-primary/20 group-hover:border-primary/40"
                    />
                    <h3 className="text-2xl sm:text-3xl font-bold mb-3 group-hover:text-primary transition-colors text-foreground">
                      ABINARA-1
                    </h3>
                    <p className="text-sm sm:text-base text-muted-foreground mb-8">
                      Tim Riset & Development Robot
                    </p>
                  </div>

                  {/* Robots Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 mt-12">
                    {/* Fiametta Robot */}
                    <div className="robot-card group/robot relative">
                      <div className="relative bg-gradient-to-br from-card/80 via-card/60 to-card/40 border border-border/50 rounded-xl p-4 sm:p-6 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-primary/0 group-hover/robot:from-primary/5 group-hover/robot:via-primary/10 group-hover/robot:to-primary/5 transition-all duration-500 rounded-xl"></div>
                        
                        <div className="relative z-10 mb-4 flex items-center justify-center">
                          <div className="relative w-32 h-32 sm:w-40 sm:h-40 mx-auto">
                            <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl group-hover/robot:bg-primary/20 transition-all duration-500"></div>
                            <div className="relative w-full h-full rounded-lg overflow-hidden bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20 group-hover/robot:border-primary/40 transition-all duration-300">
                              <Image
                                src="https://raw.githubusercontent.com/Abinara-1-its/Abinara-1/main/public/images/robots/fiametta.png"
                                alt="Fiametta Robot"
                                fill
                                className="object-contain p-3 group-hover/robot:scale-110 transition-transform duration-500"
                                sizes="(max-width: 640px) 128px, 160px"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="relative z-10 text-center">
                          <h4 className="text-base sm:text-lg font-bold mb-1 group-hover/robot:text-primary transition-colors">
                            Fiametta
                          </h4>
                          <div className="h-0.5 w-12 bg-gradient-to-r from-transparent via-primary/50 to-transparent mx-auto opacity-0 group-hover/robot:opacity-100 transition-opacity duration-300"></div>
                        </div>
                      </div>
                    </div>

                    {/* Phynix Robot */}
                    <div className="robot-card group/robot relative">
                      <div className="relative bg-gradient-to-br from-card/80 via-card/60 to-card/40 border border-border/50 rounded-xl p-4 sm:p-6 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-primary/0 group-hover/robot:from-primary/5 group-hover/robot:via-primary/10 group-hover/robot:to-primary/5 transition-all duration-500 rounded-xl"></div>
                        
                        <div className="relative z-10 mb-4 flex items-center justify-center">
                          <div className="relative w-32 h-32 sm:w-40 sm:h-40 mx-auto">
                            <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl group-hover/robot:bg-primary/20 transition-all duration-500"></div>
                            <div className="relative w-full h-full rounded-lg overflow-hidden bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20 group-hover/robot:border-primary/40 transition-all duration-300">
                              <Image
                                src="https://raw.githubusercontent.com/Abinara-1-its/Abinara-1/main/public/images/robots/phynix.png"
                                alt="Phynix Robot"
                                fill
                                className="object-contain p-3 group-hover/robot:scale-110 transition-transform duration-500"
                                sizes="(max-width: 640px) 128px, 160px"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="relative z-10 text-center">
                          <h4 className="text-base sm:text-lg font-bold mb-1 group-hover/robot:text-primary transition-colors">
                            Phynix
                          </h4>
                          <div className="h-0.5 w-12 bg-gradient-to-r from-transparent via-primary/50 to-transparent mx-auto opacity-0 group-hover/robot:opacity-100 transition-opacity duration-300"></div>
                        </div>
                      </div>
                    </div>

                    {/* Arabot Robot */}
                    <div className="robot-card group/robot relative">
                      <div className="relative bg-gradient-to-br from-card/80 via-card/60 to-card/40 border border-border/50 rounded-xl p-4 sm:p-6 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-primary/0 group-hover/robot:from-primary/5 group-hover/robot:via-primary/10 group-hover/robot:to-primary/5 transition-all duration-500 rounded-xl"></div>
                        
                        <div className="relative z-10 mb-4 flex items-center justify-center">
                          <div className="relative w-32 h-32 sm:w-40 sm:h-40 mx-auto">
                            <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl group-hover/robot:bg-primary/20 transition-all duration-500"></div>
                            <div className="relative w-full h-full rounded-lg overflow-hidden bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20 group-hover/robot:border-primary/40 transition-all duration-300">
                              <Image
                                src="https://raw.githubusercontent.com/Abinara-1-its/Abinara-1/main/public/images/robots/arabot.png"
                                alt="Arabot Robot"
                                fill
                                className="object-contain p-3 group-hover/robot:scale-110 transition-transform duration-500"
                                sizes="(max-width: 640px) 128px, 160px"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="relative z-10 text-center">
                          <h4 className="text-base sm:text-lg font-bold mb-1 group-hover/robot:text-primary transition-colors">
                            Arabot
                          </h4>
                          <div className="h-0.5 w-12 bg-gradient-to-r from-transparent via-primary/50 to-transparent mx-auto opacity-0 group-hover/robot:opacity-100 transition-opacity duration-300"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </a>
              </ShimmerCard>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* GitHub Organizations */}
            {organizations.length > 0 && organizations.map((org, index) => (
              <ShimmerCard key={org.id} delay={(index + 1) * 0.1} className="org-card text-center group">
                <a
                  href={org.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-6"
                >
                  <Image
                    src={org.avatar_url}
                    alt={org.login}
                    width={80}
                    height={80}
                    className="w-20 h-20 rounded-full mx-auto mb-4 group-hover:scale-110 transition-transform"
                  />
                  <h3 className="text-sm sm:text-base font-bold mb-2 group-hover:text-primary transition-colors text-foreground">
                    {org.login}
                  </h3>
                  {org.description && (
                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                      {org.description}
                    </p>
                  )}
                </a>
              </ShimmerCard>
            ))}
          </div>
        </div>
      </section>
    );
  }
);

OrganizationsSection.displayName = "OrganizationsSection";

export default OrganizationsSection;
