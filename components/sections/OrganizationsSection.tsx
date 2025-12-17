"use client";

import { forwardRef, useState } from "react";
import Image from "next/image";
import ShimmerCard from "@/components/ShimmerCard";
import SectionTitle from "@/components/SectionTitle";
import { Users, X, BookOpen, Zap } from "lucide-react";
import dynamic from "next/dynamic";

const Robot3DViewer = dynamic(() => import("@/components/Robot3DViewer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 bg-gradient-to-br from-card/50 to-accent/20 rounded-lg border border-border flex items-center justify-center">
      <div className="text-muted-foreground text-sm">Loading 3D model...</div>
    </div>
  ),
});

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
    const [showFiamettaDetails, setShowFiamettaDetails] = useState(false);

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
                      <div 
                        className="relative bg-gradient-to-br from-card/80 via-card/60 to-card/40 border border-border/50 rounded-xl p-4 sm:p-6 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 overflow-hidden cursor-pointer"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setShowFiamettaDetails(true);
                        }}
                      >
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
                          <p className="text-xs text-muted-foreground mt-2">Click for details</p>
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

        {/* Fiametta Details Modal */}
        {showFiamettaDetails && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto"
            onClick={() => setShowFiamettaDetails(false)}
            style={{ maxHeight: '100vh' }}
          >
            <div 
              className="bg-card border border-border rounded-xl shadow-2xl max-w-4xl w-full my-8 flex flex-col"
              onClick={(e) => e.stopPropagation()}
              style={{ maxHeight: 'calc(100vh - 4rem)' }}
            >
              <div className="flex-shrink-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
                <h3 className="text-2xl font-bold text-foreground">Fiametta - Locomotion Controller Details</h3>
                <button
                  onClick={() => setShowFiamettaDetails(false)}
                  className="p-2 hover:bg-accent rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="overflow-y-auto p-6 space-y-8" style={{ maxHeight: 'calc(100vh - 8rem)' }}>
                {/* 3D Model Section */}
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="h-5 w-5 text-primary" />
                    <h4 className="text-xl font-bold text-foreground">3D Model</h4>
                  </div>
                  <div className="mb-4">
                    <Robot3DViewer
                      modelUrl="/3d/fiameta3.glb"
                    />
                  </div>
                </section>

                {/* State Machine Section */}
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="h-5 w-5 text-primary" />
                    <h4 className="text-xl font-bold text-foreground">State Machine for Locomotion</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    The state machine for locomotion consists of four states:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-accent/50 rounded-lg p-4 border border-border">
                      <h5 className="font-semibold text-foreground mb-2">Idle</h5>
                      <p className="text-sm text-muted-foreground">
                        Default state when the robot is not moving.
                      </p>
                    </div>
                    <div className="bg-accent/50 rounded-lg p-4 border border-border">
                      <h5 className="font-semibold text-foreground mb-2">Initiate</h5>
                      <p className="text-sm text-muted-foreground">
                        State where the robot is preparing so that it can be loaded or unloaded safely.
                      </p>
                    </div>
                    <div className="bg-accent/50 rounded-lg p-4 border border-border">
                      <h5 className="font-semibold text-foreground mb-2">Loaded</h5>
                      <p className="text-sm text-muted-foreground">
                        State where the robot is locomoting.
                      </p>
                    </div>
                    <div className="bg-accent/50 rounded-lg p-4 border border-border">
                      <h5 className="font-semibold text-foreground mb-2">Emergency</h5>
                      <p className="text-sm text-muted-foreground">
                        State where the robot is in an emergency situation (Defined as a situation where the robot orientation is not within the safe range).
                      </p>
                    </div>
                  </div>
                </section>

                {/* MPC Benchmark Results Section */}
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="h-5 w-5 text-primary" />
                    <h4 className="text-xl font-bold text-foreground">MPC Benchmark Results</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Based on non-reduced MPC, aka MPC is optimizing all legs and all legs is in stance over horizon.
                    Tested on Ubuntu 20.04 Intel i5-8350U (8) @ 3.600GHz, All solver and code is compiled with -march=native -O3 flag, use OpenMP for Eigen.
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <h5 className="font-semibold text-foreground mb-3">Standard Library</h5>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-accent/50 border-b border-border">
                              <th className="text-left p-3 font-semibold text-foreground">Solver</th>
                              <th className="text-right p-3 font-semibold text-foreground">Solve Time</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b border-border">
                              <td className="p-3 text-foreground">qpOASES</td>
                              <td className="p-3 text-right text-foreground">6.2ms</td>
                            </tr>
                            <tr className="border-b border-border">
                              <td className="p-3 text-foreground">Quadprogpp</td>
                              <td className="p-3 text-right text-foreground">15.2ms</td>
                            </tr>
                            <tr className="border-b border-border">
                              <td className="p-3 text-foreground">ProxSuite (Dense)</td>
                              <td className="p-3 text-right text-foreground">23.2ms</td>
                            </tr>
                            <tr className="border-b border-border">
                              <td className="p-3 text-foreground">ProxSuite (Sparse)</td>
                              <td className="p-3 text-right text-foreground">67.6ms</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div>
                      <h5 className="font-semibold text-foreground mb-3">With Intel MKL Library</h5>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-accent/50 border-b border-border">
                              <th className="text-left p-3 font-semibold text-foreground">Solver</th>
                              <th className="text-right p-3 font-semibold text-foreground">Solve Time</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b border-border">
                              <td className="p-3 text-foreground">qpOASES</td>
                              <td className="p-3 text-right text-foreground">3ms</td>
                            </tr>
                            <tr className="border-b border-border">
                              <td className="p-3 text-foreground">Quadprogpp</td>
                              <td className="p-3 text-right text-foreground">13ms</td>
                            </tr>
                            <tr className="border-b border-border">
                              <td className="p-3 text-foreground">ProxSuite (Dense)</td>
                              <td className="p-3 text-right text-foreground">16.5ms</td>
                            </tr>
                            <tr className="border-b border-border">
                              <td className="p-3 text-foreground">ProxSuite (Sparse)</td>
                              <td className="p-3 text-right text-foreground">52.3ms</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </section>

                {/* References Section */}
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <h4 className="text-xl font-bold text-foreground">References</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    The locomotion controller is implemented based on the following papers:
                  </p>
                  <div className="space-y-3">
                    <div className="bg-accent/50 rounded-lg p-4 border border-border">
                      <p className="text-sm text-foreground">
                        <strong>Jared Di Carlo.</strong> 2020. Software and control design for the MIT Cheetah quadruped robots. M. Eng. Thesis, Massachusetts Institute of Technology, Department of Electrical Engineering and Computer Science.{" "}
                        <a href="https://hdl.handle.net/1721.1/129877" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          https://hdl.handle.net/1721.1/129877
                        </a>
                      </p>
                    </div>
                    <div className="bg-accent/50 rounded-lg p-4 border border-border">
                      <p className="text-sm text-foreground">
                        <strong>Donghyun Kim, Jared Di Carlo, Benjamin Katz, Gerardo Bledt, and Sangbae Kim.</strong> 2019. Highly Dynamic Quadruped Locomotion via Whole-Body Impulse Control and Model Predictive Control. arXiv:1909.06586 [cs.RO].{" "}
                        <a href="https://doi.org/10.48550/arXiv.1909.06586" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          https://doi.org/10.48550/arXiv.1909.06586
                        </a>
                      </p>
                    </div>
                    <div className="bg-accent/50 rounded-lg p-4 border border-border">
                      <p className="text-sm text-foreground">
                        <strong>Pierre-Alexandre Léziart.</strong> 2022. Locomotion control of a lightweight quadruped robot. PhD Thesis, UPS Toulouse. HAL Id: tel-03936109v1
                      </p>
                    </div>
                    <div className="bg-accent/50 rounded-lg p-4 border border-border">
                      <p className="text-sm text-foreground">
                        <strong>Michael Bloesch, Marco Hutter, Mark A. Hoepflinger, Stefan Leutenegger, Christian Gehring, C David Remy, and Roland Siegwart.</strong> 2012. State Estimation for Legged Robots – Consistent Fusion of Leg Kinematics and IMU. Robotics: Science and Systems Conference (RSS).{" "}
                        <span className="text-muted-foreground">DOI: 10.15607/RSS.2012.VIII.003</span>
                      </p>
                    </div>
                    <div className="bg-accent/50 rounded-lg p-4 border border-border">
                      <p className="text-sm text-foreground">
                        <strong>Jared Di Carlo, Patrick M. Wensing, Benjamin Katz, Gerardo Bledt, and Sangbae Kim.</strong> 2018. Dynamic Locomotion in the MIT Cheetah 3 Through Convex Model-Predictive Control. In IEEE International Conference on Intelligent Robots and Systems (IROS).{" "}
                        <span className="text-muted-foreground">DOI: 10.1109/IROS.2018.8594448</span>.{" "}
                        <a href="https://hdl.handle.net/1721.1/138000" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          https://hdl.handle.net/1721.1/138000
                        </a>
                      </p>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        )}
      </section>
    );
  }
);

OrganizationsSection.displayName = "OrganizationsSection";

export default OrganizationsSection;
