import React from 'react';

const Loader = ({ text = "Analyzing..." }: { text?: string }) => {
  return (
    <div className="flex items-center justify-center space-x-2">
      <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
      <span className="text-white">{text}</span>
    </div>
  );
};

export default Loader;
