import { useRef } from "react";

interface UpdatesSectionProps {
  updateLogs: any[];
  updateLogsContainerRef: React.RefObject<HTMLDivElement | null>;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
}

export default function UpdatesSection({
  updateLogs,
  updateLogsContainerRef,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: UpdatesSectionProps) {
  if (updateLogs.length === 0) {
    return null;
  }

  return (
    <>
      <div className="h-12 sm:h-16 md:h-20 bg-gradient-to-b from-background via-background to-background"></div>
      <section id="updates" className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">Update Logs</h2>
        <div className="max-w-3xl mx-auto">
          {/* Fixed height container with scroll */}
          <div
            ref={updateLogsContainerRef}
            className="h-[600px] overflow-y-auto space-y-4 update-logs-scroll"
          >
            {updateLogs.map((log: any) => (
              <div
                key={log.id}
                className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold">{log.title}</h3>
                      {log.version && (
                        <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-sm font-medium">
                          v{log.version}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {log.author && (
                        <div className="flex items-center gap-1">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                          <span>{log.author}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span>
                          {new Date(log.date || log.createdAt).toLocaleDateString("id-ID", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      {log.commitHash && (
                        <span className="font-mono text-xs">
                          {log.commitHash.substring(0, 7)}
                        </span>
                      )}
                    </div>
                  </div>
                  {log.commitUrl && (
                    <a
                      href={log.commitUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors flex-shrink-0"
                      title="View on GitHub"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </a>
                  )}
                </div>
                {(() => {
                  if (!log.description) return null;
                  const branchMatch = log.description.match(
                    /\[(?:Branch|Branches):\s*([^\]]+)\]/
                  );
                  const branches =
                    branchMatch?.[1]?.split(",").map((b: string) => b.trim()) || [];
                  const cleanDescription = log.description
                    .replace(/\[(?:Branch|Branches):[^\]]+\]/g, "")
                    .trim();

                  return (
                    <div className="mb-3">
                      {cleanDescription && (
                        <p className="text-muted-foreground leading-relaxed mb-2">
                          {cleanDescription}
                        </p>
                      )}
                      {/* Display branch badges */}
                      {branches.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {branches.map((branch: string, idx: number) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-medium"
                            >
                              {branch}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
                {log.changes && log.changes.length > 0 && (
                  <ul className="space-y-2 mt-4">
                    {log.changes.map((change: string, idx: number) => (
                      <li
                        key={idx}
                        className="text-sm text-muted-foreground flex items-start gap-2"
                      >
                        <span className="text-primary mt-1">•</span>
                        <span>{change}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between gap-4 mt-6">
            <button
              onClick={() => {
                if (updateLogsContainerRef.current) {
                  updateLogsContainerRef.current.scrollTo({
                    top: 0,
                    behavior: "smooth",
                  });
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg hover:bg-accent transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 15l7-7 7 7"
                />
              </svg>
              <span>Previous</span>
            </button>

            {hasNextPage ? (
              <button
                onClick={() => {
                  if (hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                  }
                }}
                disabled={isFetchingNextPage}
                className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isFetchingNextPage ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    <span>Load More</span>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </>
                )}
              </button>
            ) : (
              <div className="text-sm text-muted-foreground">
                Semua update logs telah dimuat
              </div>
            )}

            <button
              onClick={() => {
                if (updateLogsContainerRef.current) {
                  updateLogsContainerRef.current.scrollTo({
                    top: updateLogsContainerRef.current.scrollHeight,
                    behavior: "smooth",
                  });
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg hover:bg-accent transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Next</span>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          </div>
        </div>
      </section>
    </>
  );
}

