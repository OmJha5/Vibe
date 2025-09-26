import { Fragment } from "@/generated/prisma";
import {useState} from "react"
import {ExternalLinkIcon , RefreshCcwIcon} from "lucide-react"
import {Button} from "@/components/ui/button"
import { Hints } from "@/components/Hints";

interface Props{
    data : Fragment;
}

export function FragmentWeb({data} : Props){
    const [fragmentKey , setFragmentKey] = useState(0);
    const [copied , setCopied] = useState(false);

    const onRefresh = () => {
        setFragmentKey((prev) => prev + 1);
    }

    const handleCopy = () => {
        navigator.clipboard.writeText(data.sandboxUrl);
        setCopied(true);
        setTimeout(() => setCopied(false) , 2000);
    }

    return (
        <div className="flex flex-col w-full h-full">
            <div className="p-2 border-b bg-sidebar flex items-center gap-x-2">
                <Hints text="Refresh" side="bottom" align="end">
                    <Button size="sm" variant="outline" onClick={onRefresh}>
                        <RefreshCcwIcon />
                    </Button>
                </Hints>

                <Hints text="Click to copy" side="bottom" align="center">
                    <Button disabled={!data.sandboxUrl || copied} size="sm" variant="outline" onClick={handleCopy} className="flex-1 justify-start text-start font-normal">
                        <span className="truncate">
                            {data.sandboxUrl}
                        </span>
                    </Button>
                </Hints>

                <Hints text="Open in a new tab" side="bottom" align="start">
                    <Button 
                        size="sm"
                        disabled={!data.sandboxUrl}
                        variant="outline"
                        onClick={() => {
                            if(!data.sandboxUrl) return;
                            window.open(data.sandboxUrl , "_blank") // eak new tab mai iss specific url ko open kardo
                        }}
                    >
                        <ExternalLinkIcon />
                    </Button>
                </Hints>


            </div>
             
            <iframe 
                key={fragmentKey} // Using key is a clean React way to force React to throw away the old iframe and mount a fresh one.
                className="h-full w-full"
                sandbox="allow-forms allow-scripts allow-same-origin"
                loading="lazy"
                src={data.sandboxUrl}
            />
        </div>
    )
}