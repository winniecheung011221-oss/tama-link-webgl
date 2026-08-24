import type { CSSProperties, ImgHTMLAttributes } from "react";

type StaticImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string | { src: string };
  fill?: boolean;
  sizes?: string;
};

export default function StaticImage({ src, fill, style, width, height, ...props }: StaticImageProps) {
  const fillStyle: CSSProperties | undefined = fill
    ? { position: "absolute", inset: 0, width: "100%", height: "100%", ...style }
    : style;

  return (
    <img
      {...props}
      src={typeof src === "string" ? src : src.src}
      style={fillStyle}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
    />
  );
}
