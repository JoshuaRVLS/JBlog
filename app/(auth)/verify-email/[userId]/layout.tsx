export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <section className="w-dvw h-dvh flex justify-center items-center p-4">
      {children}
    </section>
  );
}
