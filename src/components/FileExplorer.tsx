import {CopyCheckIcon , CopyIcon} from "lucide-react"
import { Button } from "@/components/ui/button"
import {Hints} from "@/components/Hints"
import {useState , useMemo , useCallback , Fragment} from "react";
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from "@/components/ui/resizable";
import {Breadcrumb , BreadcrumbItem , BreadcrumbList , BreadcrumbPage , BreadcrumbSeparator , BreadcrumbEllipsis} from "@/components/ui/breadcrumb" 
import { CodeView } from "./code-view";
import { convertFilesToTreeItems } from "@/lib/utils";
import { TreeView } from "./TreeView";

// { path1 : content1 , path2 : content2}
type FileCollection = {
    [path : string] : string
}

interface FileBreadCrumbProps {
    filePath : string
}

function getLangugageFromExtension(filename : string) : string{
    const extension = filename.split('.').pop()?.toLowerCase();
    return extension || "text"
}

interface FileExplorerProps{
    files : FileCollection
}

// Below function is used to handle Breadcrumb code
const FileBreadCrumb = ({filePath} : FileBreadCrumbProps) => {

    const solve = () => {
        let maxSegments = 3;
        let splits = filePath.split("/");

        if(splits.length <= maxSegments){
            let lastPathIndex = splits.length - 1;

            return splits.map((pathName , index) => (
                index === lastPathIndex ? (
                    <BreadcrumbItem key={index}>
                        <BreadcrumbPage>{pathName}</BreadcrumbPage>
                    </BreadcrumbItem>
                ) : (
                    <Fragment key={index} >
                        <BreadcrumbItem >
                            <span>{pathName}</span>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                    </Fragment>
                )
            ))
        }
        else{
            let firstPathName = splits[0]
            let lastPathName = splits[splits.length - 1];

            return (
                <>
                    <BreadcrumbItem >
                        <span>{firstPathName}</span>
                    </BreadcrumbItem>

                    <BreadcrumbEllipsis />
                    
                    <BreadcrumbItem >
                        <span>{lastPathName}</span>
                    </BreadcrumbItem>
                </>
            )
        }
    }

    return (
        <Breadcrumb>
            <BreadcrumbList>
                {solve()}
            </BreadcrumbList>
        </Breadcrumb>
    )
}

export const FileExplorer = ({files} : FileExplorerProps) => {
    let [copied , setCopied] = useState(false);

    const parsedFiles = typeof files === "string" ? JSON.parse(files) : files;

    let [selectedFilePath , setSelectedFilePath] = useState<string | null>(() => {
        const fileKeys = Object.keys(parsedFiles);
        return fileKeys.length > 0 ? fileKeys[0] : null;
    });

    // To handle the copy of the code part
    const handleCopy = () => {
        if(selectedFilePath){
            navigator.clipboard.writeText(parsedFiles[selectedFilePath]);
            setCopied(true);
            setTimeout(() => setCopied(false) , 2000);
        }
    }

    const treeData = useMemo(() => {
        return convertFilesToTreeItems(parsedFiles);
    } , [parsedFiles])

    const handleFileSelect = useCallback((filePath : string) => {
        if(parsedFiles[filePath]){
            setSelectedFilePath(filePath);
        }
    } , [parsedFiles])

    return (
        <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={30} minSize={30} className="bg-sidebar">
                <TreeView
                    data = {treeData}
                    value={selectedFilePath}
                    onSelect={handleFileSelect}
                />
            </ResizablePanel>

            <ResizableHandle className="hover : bg-primary transition-colors"></ResizableHandle>

            <ResizablePanel defaultSize={70} minSize={50}>
                {selectedFilePath && parsedFiles[selectedFilePath] ? (
                    <div className="h-full w-full flex flex-col ">
                        <div className="border-b bg-sidebar px-2 py-2 flex justify-between items-center gap-x-2">
                            <FileBreadCrumb filePath={selectedFilePath} />

                            <Hints text="Copy to clipboard" side="bottom">
                                <Button 
                                    variant="outline"
                                    size="icon"
                                    className="ml-auto"
                                    onClick={handleCopy}
                                    disabled={copied}
                                >
                                    {(copied) ? <CopyCheckIcon /> : <CopyIcon />}

                                </Button>
                            </Hints>
                        </div>

                        <div className="flex-1 overflow-auto">
                            <CodeView
                                code={parsedFiles[selectedFilePath]}
                                lang={getLangugageFromExtension(selectedFilePath)}
                            />

                        </div>
                    </div>
                ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                        Select a file to view its content.
                    </div>
                )}
            </ResizablePanel>

        </ResizablePanelGroup>

    )
}

