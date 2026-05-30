import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-8">
      <div className="max-w-sm w-full text-center">
        <h1 className="text-4xl font-serif text-stone-800 mb-3">Heirloom</h1>
        <p className="text-stone-500 text-base leading-relaxed mb-2">
          Every recipe tells a story.
        </p>
        <p className="text-stone-400 text-sm leading-relaxed mb-10">
          AI-powered digitization for handwritten family recipes. Preserve the handwriting. Share with family. Print a cookbook.
        </p>

        <div className="space-y-3">
          <Link
            href="/upload"
            className="block w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-4 rounded-xl transition-colors"
          >
            Digitize a recipe card
          </Link>
          <Link
            href="/archive"
            className="block w-full bg-white hover:bg-stone-50 text-stone-700 font-medium py-4 rounded-xl border border-stone-200 transition-colors"
          >
            View my archive
          </Link>
        </div>

        <p className="text-stone-300 text-xs mt-10">
          Free for up to 25 recipes
        </p>
      </div>
    </main>
  );
}
