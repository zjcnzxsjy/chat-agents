export function getGeneratorQueryPrompt(currentDate: string, numberQueries: number, researchTopic: string) {
  return `Your goal is to generate sophisticated and diverse web search queries. 

    These queries are intended for an advanced automated web research tool capable of analyzing complex results, following links, and synthesizing information.

    Instructions:
    - Always prefer a single search query, only add another query if the original question requests multiple aspects or elements and one query is not enough.
    - Each query should focus on one specific aspect of the original question.
    - Don't produce more than ${numberQueries} queries.
    - Queries should be diverse, if the topic is broad, generate more than 1 query.
    - Don't generate multiple similar queries, 1 is enough.
    - Query should ensure that the most current information is gathered. The current date is ${currentDate}.

    Format: 
    - Format your response as a JSON object with ALL three of these exact keys:
      - "rationale": Brief explanation of why these queries are relevant
      - "query": A list of search queries

    Example:

    Topic: What revenue grew more last year apple stock or the number of people buying an iphone
    \`\`\`json
    {{
        "rationale": "To answer this comparative growth question accurately, we need specific data points on Apple's stock performance and iPhone sales metrics. These queries target the precise financial information needed: company revenue trends, product-specific unit sales figures, and stock price movement over the same fiscal period for direct comparison.",
        "query": ["Apple total revenue growth fiscal year 2024", "iPhone unit sales growth fiscal year 2024", "Apple stock price growth fiscal year 2024"],
    }}
    \`\`\`

    Context: ${researchTopic}
    `;
};

export function getWebSearcherInstructions(currentDate: string, researchTopic: string) {
  return `Conduct targeted Google Searches to gather the most recent, credible information on "${researchTopic}" and synthesize it into a verifiable text artifact.

    Instructions:
    - Query should ensure that the most current information is gathered. The current date is ${currentDate}.
    - Conduct multiple, diverse searches to gather comprehensive information.
    - Consolidate key findings while meticulously tracking the source(s) for each specific piece of information.
    - The output should be a well-written summary or report based on your search findings. 
    - Only include the information found in the search results, don't make up any information.

    Research Topic:
    ${researchTopic}`
}

export function getReflectionInstructions(researchTopic: string, summaries: string) {
  return `You are an expert research assistant analyzing summaries about "${researchTopic}".

    Instructions:
    - Identify knowledge gaps or areas that need deeper exploration and generate a follow-up query. (1 or multiple).
    - If provided summaries are sufficient to answer the user's question, don't generate a follow-up query.
    - If there is a knowledge gap, generate a follow-up query that would help expand your understanding.
    - Focus on technical details, implementation specifics, or emerging trends that weren't fully covered.

    Requirements:
    - Ensure the follow-up query is self-contained and includes necessary context for web search.

    Output Format:
    - Format your response as a JSON object with these exact keys:
      - "isSufficient": true or false
      - "knowledgeGap": Describe what information is missing or needs clarification
      - "followUpQueries": Write a specific question to address this gap

    Example:
    \`\`\`json
    {{
        "isSufficient": true, // or false
        "knowledgeGap": "The summary lacks information about performance metrics and benchmarks", // "" if isSufficient is true
        "followUpQueries": ["What are typical performance benchmarks and metrics used to evaluate [specific technology]?"] // [] if isSufficient is true
    }}
    \`\`\`

    Reflect carefully on the Summaries to identify knowledge gaps and produce a follow-up query. Then, produce your output following this JSON format:

    Summaries:
    ${summaries}`;
}

export function getFinalizeAnswerInstructions(currentDate: string, researchTopic: string, summaries: string) {
  return `Generate a high-quality answer to the user's question based on the provided summaries.

    Instructions:
    - The current date is ${currentDate}.
    - You are the final step of a multi-step research process, don't mention that you are the final step. 
    - You have access to all the information gathered from the previous steps.
    - You have access to the user's question.
    - Generate a high-quality answer to the user's question based on the provided summaries and the user's question.
    - you MUST include all the citations from the summaries in the answer correctly.

    User Context:
    - ${researchTopic}

    Summaries:
    ${summaries}`;
}