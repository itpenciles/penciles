import React from 'react';

interface LogoProps {
    className?: string;
    variant?: 'dark' | 'light' | 'outline-white';
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Logo: React.FC<LogoProps> = ({ className = "", variant = 'dark', size = 'xl' }) => {
    // In 'dark' variant (light background):
    // - Pencils: text-gray-800
    // - Box: bg-gray-800 (matches Pencils)
    // - It: text-white

    // In 'light' variant (dark background):
    // - Pencils: text-white
    // - Box: bg-white (matches Pencils)
    // - It: text-gray-900 (contrasts with box)

    // In 'outline-white' variant (dark background, outline style):
    // - Pencils: text-white
    // - Box: border-2 border-white bg-transparent
    // - It: text-white

    let boxColor = '';
    let textColorIt = '';
    let textColorPencils = '';
    let borderClass = '';

    if (variant === 'dark') {
        boxColor = 'bg-gray-800';
        textColorIt = 'text-white';
        textColorPencils = 'text-gray-800';
    } else if (variant === 'light') {
        boxColor = 'bg-white';
        textColorIt = 'text-gray-900';
        textColorPencils = 'text-white';
    } else if (variant === 'outline-white') {
        boxColor = 'bg-transparent';
        textColorIt = 'text-white';
        textColorPencils = 'text-white';
        borderClass = 'border-2 border-white';
    }

    let textSize = 'text-xl';
    let padding = 'px-2 py-0.5';
    // Border is no longer needed as it's a filled box, but we can keep a rounded shape.

    if (size === 'lg') {
        textSize = 'text-2xl';
        padding = 'px-2.5 py-1';
    } else if (size === 'md') {
        textSize = 'text-xl';
        padding = 'px-2 py-0.5';
    } else if (size === 'sm') {
        textSize = 'text-lg';
        padding = 'px-1.5 py-0.5';
    }

    return (
        <div className={`flex items-center ${className}`}>
            <div className={`flex items-center justify-center ${boxColor} ${borderClass} rounded-lg ${padding} mr-2`}>
                <span className={`font-bold ${textSize} ${textColorIt} leading-none`}>It</span>
            </div>
            <span className={`font-bold ${textSize} ${textColorPencils} leading-none`}>Pencils</span>
        </div>
    );
};
