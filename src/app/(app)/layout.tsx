import BottomNav from "@/components/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-stone-50 pb-28">
      {children}
      <BottomNav />
    </div>
  );
}
