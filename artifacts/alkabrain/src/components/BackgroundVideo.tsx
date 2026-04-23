export function BackgroundVideo() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[#2F2723]">
      <video
        src="https://cdn.pixabay.com/video/2024/02/28/202425-918413817_large.mp4"
        autoPlay
        muted
        loop
        playsInline
        className="w-full h-full object-cover opacity-40"
        onError={(e) => {
          e.currentTarget.src = "https://cdn.pixabay.com/video/2023/10/31/187788-879986675_large.mp4";
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#FCFAF8]/70 via-[#FCFAF8]/60 to-[#FCFAF8]/80 backdrop-blur-[2px]" />
    </div>
  );
}
