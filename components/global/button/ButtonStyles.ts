export type Variant = "gold" | "outline" | "classic";
export type Size = "medium" | "small";

export function getButtonClasses({variant = "gold", size = "medium", fullWidth = false, className = "",}: {
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
        
        gold: `
      bg-lol-gold
      text-[#050505]
      hover:brightness-105
      shadow-glow-gold
    `,

        outline: `
      border border-white/10
      text-gray-400
      bg-transparent
      hover:text-white
      hover:bg-white/5
    `,

        classic: `
      text-gray-400
      bg-transparent
      hover:text-white
      hover:bg-white/5
    `,
    };

    return `${base} ${sizes[size]} ${variants[variant]} ${className}`;
}