import { useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { motion } from "framer-motion";

export function VideoDemo() {
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <section id="demo" className="py-24 bg-[#FAEEE4]">
      <div className="container mx-auto px-4">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-5xl font-bold text-[#2F2723] mb-4">See AlkaBrain in action.</h2>
          <p className="text-[#7E7367] text-lg max-w-2xl mx-auto">
            Witness the fluid intelligence and real-time processing of your new cognitive companion.
          </p>
        </motion.div>

        <motion.div 
          className="max-w-4xl mx-auto relative rounded-3xl overflow-hidden shadow-2xl border-4 border-[#E87D30]/20 bg-black"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-[#2F2723]/60 to-transparent z-10 pointer-events-none" />
          <video
            ref={videoRef}
            src="https://cdn.pixabay.com/video/2024/02/28/202425-918413817_large.mp4"
            autoPlay
            muted={isMuted}
            loop
            playsInline
            className="w-full h-auto aspect-video object-cover opacity-90"
            onError={(e) => {
              e.currentTarget.src = "https://cdn.pixabay.com/video/2023/10/31/187788-879986675_large.mp4";
            }}
          />
          <button 
            onClick={toggleMute}
            className="absolute bottom-6 right-6 z-20 w-12 h-12 bg-[#FCFAF8]/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-[#FCFAF8]/40 transition-colors"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </motion.div>
      </div>
    </section>
  );
}