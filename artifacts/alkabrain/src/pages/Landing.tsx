import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { BackgroundVideo } from "@/components/BackgroundVideo";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import logoPng from "@assets/logo.png";

const APK_URL = "https://raw.githubusercontent.com/vermashreyansh580-jpg/Alkabrain/main/artifacts/alkabrain/public/alkabrain.apk";

function Features() {
  const features = [
    {
      title: "Neural Architecture",
      description: "Powered by advanced multi-modal models that understand text, vision, and intent with unprecedented accuracy.",
    },
    {
      title: "Warm Intelligence",
      description: "Designed to feel like a collaborator, not a calculator. AlkaBrain adapts to your creative rhythm.",
    },
    {
      title: "Instant Processing",
      description: "Zero-latency responses and real-time generation. Your thoughts turn into reality at the speed of mind.",
    },
  ];

  return (
    <section id="features" className="py-24">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              className="p-8 rounded-2xl bg-white/70 backdrop-blur-md shadow-sm border border-[#FAEEE4] hover:shadow-md transition-shadow"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="w-12 h-12 rounded-full bg-[#FAEEE4] text-[#E87D30] flex items-center justify-center mb-6">
                <span className="font-bold">{i + 1}</span>
              </div>
              <h3 className="text-xl font-bold text-[#2F2723] mb-3">{feature.title}</h3>
              <p className="text-[#7E7367] leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-32 bg-[#E87D30]/90 backdrop-blur-md relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,white_0%,transparent_100%)]"></div>
      <div className="container mx-auto px-4 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <img src={logoPng} alt="AlkaBrain" className="w-20 h-20 mx-auto mb-8 brightness-0 invert" />
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">Ready to expand your mind?</h2>
          <p className="text-[#FAEEE4] text-xl mb-10 max-w-2xl mx-auto">
            Download AlkaBrain on your phone and carry a thinking companion in your pocket.
          </p>
          <Button size="lg" className="h-16 px-10 text-xl font-bold bg-white text-[#E87D30] hover:bg-[#FAEEE4] rounded-full shadow-xl transition-transform hover:scale-105" asChild>
            <a href={APK_URL} download="AlkaBrain.apk">
              <Download className="w-6 h-6 mr-2" />
              Download AlkaBrain APK
            </a>
          </Button>
          <p className="text-[#FAEEE4]/80 text-sm mt-4">Android · Free · Latest version</p>
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-12 bg-[#2F2723]/90 backdrop-blur-md text-[#7E7367] text-center">
      <div className="container mx-auto px-4 flex flex-col items-center">
        <img src={logoPng} alt="AlkaBrain" className="w-8 h-8 mb-6 opacity-50 grayscale" />
        <div className="flex gap-6 mb-8">
          <a href="#" className="hover:text-white transition-colors">Privacy</a>
          <a href="#" className="hover:text-white transition-colors">Terms</a>
          <a href={APK_URL} download="AlkaBrain.apk" className="text-[#E87D30] hover:text-[#FAEEE4] transition-colors">Download APK</a>
        </div>
        <p>© {new Date().getFullYear()} AlkaBrain. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen text-[#2F2723] font-sans selection:bg-[#E87D30] selection:text-white">
      <BackgroundVideo />
      <Navbar />
      <Hero />
      <Features />
      <CTASection />
      <Footer />
    </div>
  );
}
