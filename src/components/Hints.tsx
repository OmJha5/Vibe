"use client"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from "@/components/ui/tooltip"

interface HintProps{
    children : React.ReactNode
    text : string,
    side ?: "top" | "right" | "bottom" | "left",
    align ?: "center" | "start" | "end"
}

export const Hints = ({children , text , side = "top" , align = "center"} : HintProps) => {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    {children}
                </TooltipTrigger>
                <TooltipContent>
                    {text}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}
