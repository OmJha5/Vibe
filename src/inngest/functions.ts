import { Sandbox } from "@e2b/code-interpreter"
import { openai, createAgent, createTool, createNetwork } from "@inngest/agent-kit";
import { inngest } from "./client";
import { getSandbox, lastAssistantTextMessageContent } from "./utils";
import { z } from "zod"
import { PROMPT } from "@/prompt";
import { prisma } from "@/lib/db";

export const createAgentFunction = inngest.createFunction(
  { id: "code-agent" },
  { event: "code-agent/run" },

  async ({ event, step }) => {
    const sandboxId = await step.run("get-sandbox-id", async () => {
      const sandbox = await Sandbox.create("vibe-nextjs-test-omkumarjha2");
      return sandbox.sandboxId;
    })

    const codeAgent = createAgent({
      name: "code-agent",
      description: "An expert coding agent",
      system: PROMPT,
      model: openai({
        model: "gpt-4.1",
        defaultParameters: {
          temperature: 0.1
        }

      }),
      tools: [
        createTool({
          name: "terminal",
          description: "Use the terminal to run commands",
          parameters: z.object({
            command: z.string(),
          }),

          handler: async ({ command }, { step }) => {
            return await step?.run("terminal", async () => {
              const buffers = { stdout: "", stderr: "" }

              try {
                const sandbox = await getSandbox(sandboxId)
                const result = await sandbox.commands.run(command, {
                  onStdout: (data: string) => {
                    buffers.stdout += data;
                  },
                  onStderr: (data: string) => {
                    buffers.stderr += data;
                  }
                });

                return result.stdout;
              }
              catch (e) {
                console.error(
                  `Command failed: ${e} \n stdout : ${buffers.stdout}\nstderror : ${buffers.stderr}`,
                )

                return `Command failed: ${e} \n stdout : ${buffers.stdout}\nstderror : ${buffers.stderr}`;
              }
            })
          }

        }),

        createTool({
          name: "createOrUpdateFiles",
          description: "Create or update files in the sandbox",
          parameters: z.object({
            files: z.array(
              z.object({
                path: z.string(),
                content: z.string()
              })
            )
          }),

          handler: async (
            { files },
            { step, network }
          ) => {
            const newFiles = await step?.run("createOrUpdateFiles", async () => {
              try {
                const updatedFiles = network.state.data.files || {}
                const sandbox = await getSandbox(sandboxId);

                for (const file of files) {
                  await sandbox.files.write(file.path, file.content);
                  updatedFiles[file.path] = file.content;
                }

                return updatedFiles;
              }
              catch (e) {
                return "Error: " + e;
              }
            })

            if (typeof newFiles == "object") {
              network.state.data.files = newFiles;
            }
          }

        }),

        createTool({
          name: "readFiles",
          description: "Read files from the sandbox",
          parameters: z.object({
            files: z.array(z.string()),
          }),

          handler: async ({ files }, { step }) => {
            return await step?.run("readFiles", async () => {

              try {
                const sandbox = await getSandbox(sandboxId);
                const contents = [];
                for (const file of files) {
                  const content = await sandbox.files.read(file);
                  contents.push({ path: file, content });
                }

                return JSON.stringify(contents);
              }
              catch (e) {
                return "Erorr : " + e;
              }
            })
          }
        })

      ],

      lifecycle: {
        // Means Every time the agent answers, do something with its response before continuing.
        onResponse: async ({ result, network }) => {
          const lastAssistantTextMessageText = lastAssistantTextMessageContent(result);

          if (lastAssistantTextMessageText && network) {
            if (lastAssistantTextMessageText.includes("<task_summary>")) {
              network.state.data.summary = lastAssistantTextMessageText
            }
          }

          return result;
        }
      }
    });

    const network = createNetwork({
      name: "coding-agent-network",
      agents: [codeAgent],
      maxIter: 15,
      router: async ({ network }) => {
        const summary = network.state.data.summary;

        if (summary) return;

        return codeAgent
      }
    })


    const result = await network.run(event.data.value); // it calls router and router decides whether to stop or call codeAgent for further execution
    // network eak shared memory use karta hai jo throughout the codeAgent iterations same rehti hai 

    const sandboxUrl = await step.run("get-sandbox-url", async () => {
      const sandbox = await getSandbox(sandboxId);
      const host = sandbox.getHost(3000); // Take whatever is running inside the container on port 3000 and give me a publicly accessible URL for it.
      return `https://${host}`
    })

    const isError = !(result?.state?.data?.summary) || Object.keys(result?.state?.data?.files || {}).length == 0

    await step.run("save-message", async () => {
      if(isError){
        return await prisma.message.create({
          data : {
            content : "Something went wrong , please try again",
            role : "ASSISTANT",
            type : "ERROR",
            projectId : event.data.projectId,
          }
        })
      }

      await prisma.message.create({
        data: {
          content: result.state.data.summary,
          role: "ASSISTANT",
          type: "RESULT",
          projectId : event.data.projectId,

          fragment: {
            create: {
              sandboxUrl : sandboxUrl,
              title : "Fragment",
              files : JSON.stringify(result.state.data.files)
            }
          }

        }

      })
    })

    return {
      url: sandboxUrl,
      title: "Fragment",
      files: result.state.data.files,
      summary: result.state.data.summary
    };
  },
);