"use client"
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTRPC } from '@/trpc/client'
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react'
import { toast } from 'sonner';

export default function page() {
  let trpc = useTRPC();
  let router = useRouter()
  
  const createProject = useMutation(trpc.projects.create.mutationOptions({
    onError : (error) => {
      toast.success(error.message)
    },

    onSuccess: (data) => {
      router.push(`projects/${data.id}`)
    }
  }));
  let [code , setCode] = useState("");

  return (
    <div className='p-10 space-y-4'>
      <Input value={code} onChange={(e) => setCode(e.target.value)}  />
      <Button onClick={() => createProject.mutate({value : code})}>
        Invoke Background Job
      </Button>

    </div>
  )
}
