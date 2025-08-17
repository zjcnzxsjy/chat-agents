import { Message } from "@langchain/langgraph-sdk";

export default function researchSteps(message: Message, history: Record<string, any>[]) {
  const steps = []

  for (const h of history) {
    const { values } = h;
    const { messages } = values;

    const lastMessage = messages[messages.length - 1];

    if (!lastMessage) {
      continue;
    }

    if (lastMessage.type === 'ai' && lastMessage.id === message.id) {
      const { queryList, sourcesGathered, followUpQueries } = values;
      // generate search queries
      steps.push({
        title: 'Generating Search Queries',
        data: queryList.join(', ')
      })
      // web research
      const numSources = sourcesGathered.length;
      const uniqueLabels = [
        ...new Set(sourcesGathered.map((s: any) => s.label).filter(Boolean)),
      ];
      const exampleLabels = uniqueLabels.slice(0, 3).join(", ");
      steps.push({
        title: "Web Research",
        data: `Gathered ${numSources} sources. Related to: ${
          exampleLabels || "N/A"
        }.`,
      });
      // reflection
      steps.push({
        title: "Reflection",
        data: "Search successful"
      })
      // final answer
      steps.push({
        title: "Finalizing Answer",
        data: "Report has been generated"
      })
    }
  }
  
  return steps;
}