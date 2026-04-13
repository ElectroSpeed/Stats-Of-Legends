type SpacerProps = {
    size?: number;
};

export const VerticalSpacer = ({ size = 30 }: SpacerProps) => {
    return <div style={{ height: `${size}px`, width: "100%" }} />;
};

export const HorizontalSpacer = ({ size = 10 }: SpacerProps) => {
    return <div style={{ height: "100%", width: `${size}px` }} />;
};