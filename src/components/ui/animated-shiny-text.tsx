import { type ComponentPropsWithoutRef, type CSSProperties, type FC } from "react"
import { cn } from "@/lib/utils"

export interface AnimatedShinyTextProps extends ComponentPropsWithoutRef<"span"> {
  shimmerWidth?: number
}

export const AnimatedShinyText: FC<AnimatedShinyTextProps> = ({
  children,
  className,
  shimmerWidth = 100,
  ...props
}) => {
  return (
    <span
      style={
        {
          "--shiny-width": `${shimmerWidth}px`,
          backgroundSize: `${shimmerWidth}px 100%`,
          backgroundPosition: "0 0",
          backgroundRepeat: "no-repeat",
          backgroundImage:
            "linear-gradient(to right, transparent, rgba(0,0,0,0.8) 50%, transparent)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          animation: "shiny-text 3s cubic-bezier(0.6,0.6,0,1) infinite",
        } as CSSProperties
      }
      className={cn(
        "mx-auto max-w-md text-neutral-600/70",
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
