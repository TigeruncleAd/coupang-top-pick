import React from "react";

export const LoadingSpinner: React.FC<{ loadingText: string }> = ({
  loadingText = "",
}) => {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#FF3B30] border-t-transparent"></div>
        <p className="text-gray-600">{loadingText}</p>
      </div>
    </div>
  );
};
