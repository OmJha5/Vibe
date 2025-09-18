import {Sandbox} from "@e2b/code-interpreter"
import { openai, createAgent } from "@inngest/agent-kit";
import { inngest } from "./client";
import { getSandbox } from "./utils";

export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },

  async ({ event , step}) => {
    const sandboxId = await step.run("get-sandbox-id" , async() => {
      const sandbox = await Sandbox.create("vibe-nextjs-test-omkumarjha2");
      return sandbox.sandboxId;
    })

    const codeAgent = createAgent({
      name: "code-agent",
      system: "You are an expert next.js developer .  you write readable and maintanable code and write simple next.js and react snippets.",
      model: openai({ model: "gpt-4o" }),
    });

    const { output } = await codeAgent.run(
      `write the following snippet : ${event.data.email}`
    );

    const sandboxUrl = await step.run("get-sandbox-url" , async() => {
      const sandbox = await getSandbox(sandboxId);
      const host = sandbox.getHost(3000); // Take whatever is running inside the container on port 3000 and give me a publicly accessible URL for it.
      return `https://${host}`
    })

    return {output , sandboxUrl};
  },
);