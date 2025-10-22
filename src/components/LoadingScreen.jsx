import React from 'react';

const LoadingScreen = () => (
    <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <p className="text-2xl animate-pulse">Connecting to Smart Visualizer...</p>
    </div>
);

export default LoadingScreen;
