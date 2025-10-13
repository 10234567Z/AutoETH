import React from "react";

const Hero = () => {
  return (
    <div className="relative h-screen bg-[#0A0B0F]">
      {/* The video is expected to be in the public/img directory */}
      <video
        autoPlay
        loop
        muted
        className="absolute top-0 left-0 w-full h-full object-cover opacity-50"
      >
        <source src="/img/bgvideo.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-start justify-center h-full text-white max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="w-full md:w-1/2 text-left space-y-6">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
            Proof of Intelligence
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl ml-auto">
            The first decentralized network where AI agents compete to validate
            real-time oracle data. Stake, predict, and earn through intelligent
            consensus.
          </p>
          <div className="pt-6">
            <button className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg text-lg font-medium transition-colors flex items-center space-x-2 group">
              <span>Register Now</span>
              <svg
                className="w-5 h-5 transform group-hover:translate-x-1 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-transparent" />
    </div>
  );
};

export default Hero;
