import { brand } from "@/config/brand";

/**
 * The official ORVIONIS mark for the UI. `size` is the displayed size in CSS pixels; a 2× file is served for sharp
 * rendering. Decorative by default (the name is written next to it); pass `label` when the mark stands alone.
 */
export function BrandMark({ size = 32, label, className = "" }: { size?: number; label?: string; className?: string }) {
  const src = size <= 24 ? brand.mark.webp48 : size <= 32 ? brand.mark.webp64 : brand.mark.webp128;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      width={size}
      height={size}
      alt={label ?? ""}
      aria-hidden={label ? undefined : true}
      decoding="async"
      className={`inline-block shrink-0 select-none ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
