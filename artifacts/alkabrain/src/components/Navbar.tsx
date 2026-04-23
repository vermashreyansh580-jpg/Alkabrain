import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import logoPng from "@assets/logo.png";

export function Navbar() {
  return (
    <motion.header 
      className="fixed top-0 left-0 right-0 z-50 bg-[#FCFAF8]/80 backdrop-blur-md border-b border-[#E87D30]/10"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={logoPng} alt="AlkaBrain Logo" className="w-8 h-8" />
          <span className="font-bold text-xl tracking-tight text-[#2F2723]">AlkaBrain</span>
        </div>
        <Button className="bg-[#E87D30] hover:bg-[#D86818] text-white rounded-full font-medium" asChild>
          <a href="https://shrey77777-alkabrain.hf.space/" target="_blank" rel="noopener noreferrer">
            Launch App
          </a>
        </Button>
      </div>
    </motion.header>
  );
}