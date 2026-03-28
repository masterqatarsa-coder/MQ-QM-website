import type { ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import {
  type ContentImageDisplay,
  contentImageFrameStyle,
  contentImageStyle,
} from "@/lib/contentMetadata";

type ManagedContentImageProps = {
  metadata?: Record<string, unknown>;
  frameClassName?: string;
  imgClassName?: string;
  defaultDisplay?: Partial<ContentImageDisplay>;
} & ImgHTMLAttributes<HTMLImageElement>;

export default function ManagedContentImage({
  metadata,
  frameClassName,
  imgClassName,
  defaultDisplay,
  className,
  ...imgProps
}: ManagedContentImageProps) {
  return (
    <div
      className={cn("overflow-hidden", frameClassName)}
      style={contentImageFrameStyle(metadata, defaultDisplay)}
    >
      <img
        {...imgProps}
        className={cn(className, imgClassName)}
        style={contentImageStyle(metadata, defaultDisplay)}
      />
    </div>
  );
}
