import React from 'react';

export type IconName = 'rain' | 'bolt' | 'clock' | 'wifi' | 'intensity' | 'settings' | 'download' | 'temperature' | 'chip' | 'server' | 'status' | 'signal';

interface IconProps {
  name: IconName;
  className?: string;
}

const Icon: React.FC<IconProps> = ({ name, className = 'w-6 h-6' }) => {
  const icons: Record<IconName, JSX.Element> = {
    rain: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 100 15h5.25a2.25 2.25 0 002.25-2.25v-1.125a7.498 7.498 0 00-7.5-7.5h-1.625Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 12.75V15m0-4.5v-1.5m0 9v1.5m-3-4.5h.008v.008H9v-.008Zm3.75 0h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm-3.75 0h.008v.008H9v-.008Z" />
      </svg>
    ),
    bolt: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
      </svg>
    ),
    clock: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
    wifi: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 0 1 7.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.75 18.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
      </svg>
    ),
    intensity: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75 12 3m0 0 3.75 3.75M12 3v18" />
        </svg>
    ),
    settings: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-1.007 1.11-1.226M10.343 3.94a3.75 3.75 0 0 1-3.75 3.75m3.75-3.75a3.75 3.75 0 0 0-3.75 3.75M10.343 3.94c.338-.138.694-.243 1.06-.316M14.047 20.282c.55.22, 1.02.684, 1.11 1.226m-1.11-1.226a3.75 3.75 0 0 1 3.75-3.75m-3.75 3.75a3.75 3.75 0 0 0 3.75-3.75M14.047 20.282c-.338.138-.694.243-1.06.316m-4.664-4.29a3.75 3.75 0 0 1-3.75-3.75m3.75 3.75a3.75 3.75 0 0 0-3.75-3.75m0 0c.09-.542.56-1.007 1.11-1.226m-1.11 1.226a3.75 3.75 0 0 1 3.75 3.75M3.94 13.657c-.138-.338-.243-.694-.316-1.06m1.226 1.11a3.75 3.75 0 0 1-3.75-3.75m3.75 3.75a3.75 3.75 0 0 0-3.75-3.75m0 0c.542-.09 1.007-.56 1.226-1.11m-1.226 1.11c-.281.334-.51.7-.688 1.097m8.344 8.344c.338.138.694.243 1.06.316m-1.226-1.11a3.75 3.75 0 0 1 3.75 3.75m-3.75-3.75a3.75 3.75 0 0 0 3.75 3.75m0 0c-.09.542-.56 1.007-1.11 1.226m1.11-1.226c.281-.334.51-.7.688-1.097m-8.344-8.344c.338-.138.694-.243 1.06-.316m-1.226 1.11a3.75 3.75 0 0 1-3.75-3.75m3.75 3.75a3.75 3.75 0 0 0-3.75-3.75m0 0c.09-.542.56 1.007 1.11-1.226M13.657 3.94c.138.338.243.694.316 1.06m-1.226-1.11a3.75 3.75 0 0 1 3.75 3.75m-3.75-3.75a3.75 3.75 0 0 0 3.75 3.75m0 0c-.542.09-1.007.56-1.226 1.11M12 15.75a3.75 3.75 0 1 1 0-7.5 3.75 3.75 0 0 1 0 7.5Z" />
        </svg>
    ),
    download: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
      </svg>
    ),
    temperature: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 12a4.5 4.5 0 0 0 4.5 4.5 4.5 4.5 0 0 0 4.5-4.5V4.5A4.5 4.5 0 0 0 7.5 4.5v7.5Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 8.25a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 9.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
        </svg>
    ),
    chip: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15-3.75H3m18 0h-1.5M8.25 21v-1.5m1.5.75-1.5-.75M13.5 3v1.5m4.5 3.75H21m-3.75 3.75H21m-3.75 3.75H21m-4.5 4.5v-1.5m1.5.75-1.5-.75M6.75 12a5.25 5.25 0 0 1 5.25-5.25h.01a5.25 5.25 0 0 1 5.25 5.25v.01a5.25 5.25 0 0 1-5.25 5.25h-.01a5.25 5.25 0 0 1-5.25-5.25v-.01Z" />
        </svg>
    ),
    server: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 17.25v-.228a4.5 4.5 0 0 0-.12-1.03l-2.268-9.64a3.375 3.375 0 0 0-3.285-2.65H8.228a3.375 3.375 0 0 0-3.285 2.65l-2.268 9.64a4.5 4.5 0 0 0-.12 1.03v.228m19.5 0a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3m19.5 0a3 3 0 0 0-3-3H5.25a3 3 0 0 0-3 3m16.5 0h.008v.008h-.008v-.008Zm-3 0h.008v.008h-.008v-.008Z" />
      </svg>
    ),
    status: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75H6A2.25 2.25 0 0 0 3.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0 1 20.25 6v1.5m0 9V18A2.25 2.25 0 0 1 18 20.25h-1.5m-9 0H6A2.25 2.25 0 0 1 3.75 18v-1.5M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      </svg>
    ),
    signal: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
        </svg>
    ),
  };

  return icons[name] || null;
};

export default Icon;