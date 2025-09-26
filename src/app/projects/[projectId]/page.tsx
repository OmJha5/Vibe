import { ProjectView } from '@/modules/projects/ui/views/ProjectView';
import { getQueryClient, trpc } from '@/trpc/server';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import React, { Suspense } from 'react'

interface paramsType {
    params : {
        projectId : string
    }
}

export default async function page(props : paramsType) {
    let {projectId} = await props.params;

    const queryClient = getQueryClient();
    void queryClient.prefetchQuery(trpc.messages.getMany.queryOptions({
      projectId,
    }))

    void queryClient.prefetchQuery(trpc.projects.getOne.queryOptions({
      id : projectId,
    }))

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<p>Loading...</p>}>
            <ProjectView projectId={projectId}/>
        </Suspense>

    </HydrationBoundary>
  )
}
