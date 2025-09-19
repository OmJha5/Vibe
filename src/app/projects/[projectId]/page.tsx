import React from 'react'

interface paramsType {
    params : {
        projectId : string
    }
}

export default async function page(props : paramsType) {
    let {projectId} = await props.params;

  return (
    <div>
      {projectId}
    </div>
  )
}
