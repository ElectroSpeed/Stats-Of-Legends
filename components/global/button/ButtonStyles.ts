export type Variant = "goldGradient" | "navbarActive" | "navbarGhost";
export type Size = "medium" | "small";

export function getButtonClasses({
                                     variant = "goldGradient",
                                     size = "medium",
                                     fullWidth = false,
                                     className = "",
                                 }: {
    variant?: Variant;
    size?: Size;
    fullWidth?: boolean;
    className?: string;
}) {
    const base = `
    inline-flex items-center justify-center gap-2
    rounded-full font-bold uppercase tracking-wider
    transition-all duration-300 whitespace-nowrap
    ${fullWidth ? "w-full" : ""}
  `;

    const sizes: Record<Size, string> = {
        medium: "px-6 py-3 text-sm",
        small: "px-3 py-1.5 text-[0.625rem]",
    };

    const variants: Record<Variant, string> = {
        goldGradient: `
      bg-gradient-to-r from-lol-gold to-[#e1b255]
      text-[#050505]
      border border-lol-gold/40
      hover:brightness-105
    `,
        navbarActive: `
      bg-lol-gold text-[#050505]
      shadow-[0_0_15px_rgba(200,170,110,0.3)]
    `,
        navbarGhost: `
      text-gray-400 hover:text-white
      hover:bg-white/5
    `,
    };

    return `${base} ${sizes[size]} ${variants[variant]} ${className}`;
}