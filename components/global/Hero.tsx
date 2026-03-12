import React from "react";

interface HeroProps {
    badgeText?: string;
    title: string;
    highlight?: string;
    description: string;
}

const Hero: React.FC<HeroProps> = ({ badgeText, title, highlight, description }) => {
    return (
        <section className="relative z-[2000] pt-30 pb-20">
            <div className="max-w-7xl mx-auto px-4 text-center">

                {/* Badge */}
                {badgeText && (
                    <div className="inline-block mb-6 px-4 py-1.5 rounded-full bg-lol-gold/10 border border-lol-gold/20 text-lol-gold text-xs font-bold tracking-widest uppercase shadow-[0_0_40px_rgba(200,170,110,0.12)]">
                        {badgeText}
                    </div>
                )}

                {/* Title */}
                <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-white mb-6 font-display uppercase leading-tight">
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
                <p className="max-w-2xl mx-auto text-lg text-gray-400 font-light">
                    {description}
                </p>

            </div>
        </section>
    );
};

export default Hero;