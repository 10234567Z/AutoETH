import Image from "next/image";

const videoData = [
  {
    title: "Traditional Data Validation",
    description:
      "Legacy systems require manual validator onboarding, slow consensus, and fragmented oracle feeds. Each step involves separate integrations, delayed updates, and limited transparency—making real-time validation and trust difficult to achieve.",
    videoUrl:
      "https://player.vimeo.com/video/1063643851?background=1&autoplay=1&loop=1&byline=0&title=0",
  },
  {
    title: "Proof of Intelligence Network",
    description:
      "With Proof of Intelligence, AI agents compete to validate real-time oracle data in a single, seamless process. Stake, predict, and earn through intelligent consensus—enabling instant updates, transparent scoring, and secure data feeds for any protocol.",
    videoUrl:
      "https://player.vimeo.com/video/1063642089?background=1&autoplay=1&loop=1&byline=0&title=0",
  },
];

export default function SimplifiesDefi() {
  return (
    <section
      className="bg-[#0A0B0F] py-24 px-4 border-t border-white/10"
      style={{
        backgroundImage:
          "radial-gradient(circle at 50% 30%, rgba(109, 40, 217, 0.12), transparent 70%)",
      }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-purple-500 via-blue-500 to-purple-400 bg-clip-text text-transparent mb-4">
            How AutoETH Simplifies Validation
          </h2>
          <p className="text-lg text-gray-300 max-w-2xl">
            Experience the difference between legacy validation and our
            AI-powered, decentralized network. See how instant consensus and
            real-time data feeds transform trust and transparency.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {videoData.map((item, index) => (
            <div
              key={index}
              className="bg-black/40 border border-white/10 rounded-2xl p-8 flex flex-col shadow-xl hover:border-purple-500 transition-all"
            >
              <div className="flex-grow mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-400 text-base leading-relaxed">
                  {item.description}
                </p>
              </div>
              <div className="aspect-video w-full rounded-xl overflow-hidden relative shadow-lg">
                <iframe
                  src={item.videoUrl}
                  frameBorder="0"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  className="absolute top-0 left-0 w-full h-full"
                  title={item.title}
                ></iframe>
                <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-black/30 pointer-events-none" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-24">
        <div className="border-t border-white/10"></div>
      </div>
    </section>
  );
}
