import BottomNav from "@/components/BottomNav";
import AIAssistant from "@/components/AIAssistant";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-stone-50 pb-28">
      {children}
      <BottomNav />
      <AIAssistant />
    </div>
  );
}
