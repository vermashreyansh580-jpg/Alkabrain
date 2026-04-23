import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Suspense, lazy } from "react";
import { Loader2, Download } from "lucide-react";

const Scene = lazy(() => import("./Scene"));

export function Hero() {
  return (
    <section className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden bg-[#FCFAF8] pt-20">
      <Suspense fallback={
        <div className="absolute inset-0 flex items-center justify-center text-[#E87D30]">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      }>
        <Scene />
      </Suspense>

      <div className="relative z-10 container mx-auto px-4 md:px-6 pointer-events-none">
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center rounded-full border border-[#E87D30]/20 bg-[#FAEEE4]/80 backdrop-blur-sm px-3 py-1 text-sm font-medium text-[#E87D30] mb-6 pointer-events-auto">
              <span className="flex h-2 w-2 rounded-full bg-[#E87D30] mr-2 animate-pulse"></span>
              AlkaBrain v1.0 is Live
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-[#2F2723] mb-6 leading-[1.1]">
              The friendly <br/>
              <span className="text-[#E87D30]">genius brain</span><br/>
              glowing with energy.
            </h1>
            <p className="text-xl md:text-2xl text-[#7E7367] mb-10 max-w-2xl font-light">
              Experience the next generation of warm intelligence. AlkaBrain isn't just an assistant—it's a living, thinking companion designed to amplify your creativity.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pointer-events-auto">
              <Button size="lg" className="h-14 px-8 text-lg font-semibold bg-[#E87D30] hover:bg-[#D86818] text-white shadow-[0_0_40px_-10px_rgba(232,125,48,0.5)] rounded-full transition-all duration-300 hover:scale-105" asChild>
                <a href="/alkabrain.apk" download>
                  <Download className="w-5 h-5 mr-2" />
                  Download APK
                </a>
              </Button>
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-medium border-[#7E7367]/20 text-[#2F2723] hover:bg-[#FAEEE4] rounded-full transition-all duration-300" asChild>
                <a href="#features">
                  Discover Features
                </a>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
      
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center justify-center opacity-50 animate-bounce pointer-events-none">
        <span className="text-sm font-medium text-[#7E7367] mb-2 uppercase tracking-widest">Scroll</span>
        <div className="w-[1px] h-12 bg-gradient-to-b from-[#7E7367] to-transparent"></div>
      </div>
    </section>
  );
}