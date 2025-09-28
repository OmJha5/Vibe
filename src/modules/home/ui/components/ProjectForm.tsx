"use client"
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
import { useRouter } from "next/navigation";
import { PROJECT_TEMPLATES } from "../../constants";

const formSchema = z.object({
    value : z.string()
        .min(1  , {message : "Value is required"})
        .max(10000 , {message : "Value is too long"})
})

export const ProjectForm = () => {
    const trpc = useTRPC();
    const router = useRouter()
    
    const form = useForm<z.infer<typeof formSchema>>({ // z.infer<typeof formSchema> -> means "The data in this form matches the shape of formSchema"
        // So with z.infer we are saying our schema will be something like -> type formSchema = { value : string}
        resolver : zodResolver(formSchema),
        defaultValues : {
            value : "",
        }
    })
    
    // values contains the form data (here { value: "whatever user typed" })
    const onSubmit = async (values : z.infer<typeof formSchema>) => {
        await createProject.mutateAsync({
            value : values.value,
        })
    }
    
    const [isFocused , setIsFocused] = useState(false);
    let queryClient = useQueryClient();

    const createProject = useMutation(trpc.projects.create.mutationOptions({
        onSuccess : (data) => {
            // Fetch the new messages list from the server
            queryClient.invalidateQueries(trpc.projects.getMany.queryOptions());
            router.push(`/projects/${data.id}`)
            // Todo : Invalidate usage
        },

        onError : (error) => {
            // TODO : Redirect to pricing page if any error
            toast.error(error.message);
        }
    }))

    const isPending = createProject.isPending;
    const isButtonDisabled = isPending || !form.formState.isValid;

    const onSelect = (value : string) => {
        form.setValue("value" , value , {
            shouldDirty : true,
            shouldValidate : true,
            shouldTouch : true
        })
    }

    return (
        <Form {...form}>
            <section className="space-y-6">      
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className={cn(
                        "relative border p-4 pt-1 rounded-xl bg-sidebar dark:bg-sidebar transition-all",
                        isFocused && "shadow-xl",                
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
                                <span>&#8984;</span>Enter
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

                <div className="flex-wrap justify-center gap-2 hidden md:flex max-w-3xl">
                    {PROJECT_TEMPLATES.map((template) => (
                        <Button
                            key={template.title}
                            variant="outline"
                            size="sm"
                            className="bg-white dark:bg-sidebar"
                            onClick={() => onSelect(template.prompt)}

                        >
                            {template.emoji} {template.title}
                        </Button>
                    ))}
                </div>
            </section>
        </Form>
    )
}