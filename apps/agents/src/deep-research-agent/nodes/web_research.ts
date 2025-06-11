import { GoogleGenAI } from "@google/genai";
import { WebSearchState } from "../configuration.js";
import { getWebSearcherInstructions } from "../prompts.js";
import { getCitation, insertCitationMarkers, resolveUrls } from "../utils/common.js";

export default async function webResearch(state: typeof WebSearchState.State) {
  const client = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });
  // Uses the google genai client as the langchain client doesn't return grounding metadata
  const response = await client.models.generateContent({
    model: "gemini-2.5-flash-preview-05-20",
    contents: getWebSearcherInstructions(new Date().toISOString(), state.searchQuery),
    config: {
      tools: [{googleSearch: {}}],
      temperature: 0,
    },
  });
  // resolve the urls to short urls for saving tokens and time
  const resolvedUrls = resolveUrls(response.candidates?.[0].groundingMetadata?.groundingChunks ?? [], state.id)
  // Gets the citations and adds them to the generated text
  const citations = getCitation(response, resolvedUrls)
  const modifiedText = insertCitationMarkers(response.text ?? '', citations)
  const sourcesGathered = citations.reduce((acc, prev) => {
    acc.push(...prev.segments);
    return acc;
  }, [])
  return {
    sourcesGathered,
    searchQuery: state.searchQuery,
    webResearchResult:[modifiedText],
  }
}