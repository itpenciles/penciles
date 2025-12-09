import React from 'react';

interface LogoProps {
    className?: string;
    variant?: 'dark' | 'light'; // dark = dark text (for light bg), light = white text (for dark bg)
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Logo: React.FC<LogoProps> = ({ className = "", variant = 'dark', size = 'xl' }) => {
    const borderColor = variant === 'dark' ? 'border-brand-blue' : 'border-white';
    const textColorIt = variant === 'dark' ? 'text-brand-blue' : 'text-white';
    const textColorPencils = variant === 'dark' ? 'text-gray-800' : 'text-white';

    let textSize = 'text-xl';
    let padding = 'px-2 py-0.5';
    let border = 'border-2';

    if (size === 'lg') {
        textSize = 'text-2xl';
        padding = 'px-2.5 py-1';
        border = 'border-[2.5px]';
    } else if (size === 'md') {
        textSize = 'text-xl';
        padding = 'px-2 py-0.5';
        border = 'border-2';
    } else if (size === 'sm') {
        textSize = 'text-lg';
        padding = 'px-1.5 py-0.5';
        border = 'border-2';
    }

    return (
        <div className={`flex items-center ${className}`}>
            <div className={`flex items-center justify-center ${border} ${borderColor} rounded-lg ${padding} mr-2`}>
                <span className={`font-bold ${textSize} ${textColorIt} leading-none`}>It</span>
            </div>
            <span className={`font-bold ${textSize} ${textColorPencils} leading-none`}>Pencils</span>
        </div>
    );
};
