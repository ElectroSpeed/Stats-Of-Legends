import React from "react";

interface HeroProps {
    badgeText?: string;
    title: string;
    highlight?: string;
    description: string;
}

const Hero: React.FC<HeroProps> = ({ badgeText, title, highlight, description }) => {
    return (
        <div className="relative z-[2000] overflow-visible pt-24 sm:pt-32">
            <div className="relative z-[2100] max-w-4xl mx-auto px-4 text-center">

                {/* Badge */}
                {badgeText && (
                    <div className="inline-block mb-4 px-4 py-1.5 rounded-full bg-lol-gold/10 border border-lol-gold/20 text-lol-gold text-xs font-bold tracking-widest uppercase shadow-[0_0_40px_rgba(200,170,110,0.12)]">
                        {badgeText}
                    </div>
                )}

                {/* Title */}
                <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-7xl mb-8 font-display uppercase">
                    {title}
                    {highlight && (
                        <>
                            <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-lol-gold to-lol-red">
                                {highlight}
                            </span>
                        </>
                    )}
                </h1>

                {/* Description */}
                <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-400 font-light">
                    {description}
                </p>

            </div>
        </div>
    );
};

export default Hero;