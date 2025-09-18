"use client"
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTRPC } from '@/trpc/client'
import { useMutation } from '@tanstack/react-query';
import React, { useState } from 'react'
import { toast } from 'sonner';

export default function page() {
  let trpc = useTRPC();
  
  const invoke = useMutation(trpc.invoke.mutationOptions({
    onSuccess : () => {
      toast.success("Background Job started..")
    }
  }));
  let [code , setCode] = useState("");

  return (
    <div className='p-10 space-y-4'>
      <Input value={code} onChange={(e) => setCode(e.target.value)}  />
      <Button onClick={() => invoke.mutate({text : code})}>
        Invoke Background Job
      </Button>
    </div>
  )
}
