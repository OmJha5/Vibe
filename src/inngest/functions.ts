import { openai, createAgent } from "@inngest/agent-kit";
import { inngest } from "./client";

export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },

  async ({ event }) => {
    const codeAgent = createAgent({
      name: "code-agent",
      system: "You are an expert next.js developer .  you write readable and maintanable code and write simple next.js and react snippets.",
      model: openai({ model: "gpt-4o" }),
    });

    const { output } = await codeAgent.run(
      `write the following snippet : ${event.data.email}`
    );

    return output;
  },
);