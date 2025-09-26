import {useForm} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import {toast} from "sonner";
import {ArrowUpIcon , Loader2Icon} from "lucide-react";
import {useMutation , useQueryClient} from "@tanstack/react-query";
import TextareaAutosize from "react-textarea-autosize";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import {Form , FormField} from "@/components/ui/form";

interface Props{
    projectId : string
}

const formSchema = z.object({
    value : z.string()
        .min(1  , {message : "Value is required"})
        .max(10000 , {message : "Value is too long"})
})

export const MessageForm = ({projectId} : Props) => {
    const trpc = useTRPC();
    
    const form = useForm<z.infer<typeof formSchema>>({ // z.infer<typeof formSchema> -> means "The data in this form matches the shape of formSchema"
        // So with z.infer we are saying our schema will be something like -> type formSchema = { value : string}
        resolver : zodResolver(formSchema),
        defaultValues : {
            value : "",
        }
    })
    
    // values contains the form data (here { value: "whatever user typed" })
    const onSubmit = async (values : z.infer<typeof formSchema>) => {
        await createMessage.mutateAsync({
            value : values.value,
            projectId,
        })
    }
    
    const [isFocused , setIsFocused] = useState(false);
    const showUsage = false;
    let queryClient = useQueryClient();

    const createMessage = useMutation(trpc.messages.create.mutationOptions({
        onSuccess : (data) => {
            form.reset();
            // Fetch the new messages list from the server
            queryClient.invalidateQueries(trpc.messages.getMany.queryOptions({projectId}));
            // Todo : Invalidate usage
        },

        onError : (error) => {
            // TODO : Redirect to pricing page if any error
            toast.error(error.message);
        }
    }))

    const isPending = createMessage.isPending;
    const isButtonDisabled = isPending || !form.formState.isValid;

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className={cn(
                    "relative border p-4 pt-1 rounded-xl bg-sidebar dark:bg-sidebar transition-all",
                    isFocused && "shadow-xl",
                    showUsage && "rounded-t-none"
                
                )}
            >

                <FormField
                    control={form.control}
                    name="value"
                    render={({field}) => (
                        <TextareaAutosize
                            {...field}
                            disabled={isPending}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            minRows={2}
                            maxRows={8}
                            className="pt-4 resize-none border-none w-full outline-none bg-transparent"
                            placeholder="What would you live to build ?"
                            onKeyDown={(e) => {
                                if(e.key == "Enter") {
                                    e.preventDefault();
                                    form.handleSubmit(onSubmit)(e); // we have to pass the event object to onSubmit so it knows from where this form got submitted . we didn't specified the event when button clicked because it by default provided the button event.
                                }
                            }}
                        />
                    )}
                />

                <div className="flex gap-x-2 items-end justify-between pt-2">
                    <div className="text-[10px] text-muted-foreground font-mono">
                        <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                            <span>&#8984</span>Enter
                        </kbd>
                        &nbsp;to submit
                    </div>

                    <Button
                        disabled={isButtonDisabled}
                        className={cn(
                            "size-8 rounded-full",
                            isButtonDisabled && "bg-muted-foreground border"
                        )}
                    >
                        {
                            isPending ? (
                                <Loader2Icon className="size-4 animate-spin" />
                            ) : (
                                <ArrowUpIcon />
                            )
                        }
                    </Button>

                </div>
                

            </form>
        </Form>
    )
}