import { AIMessage, isAIMessage, isHumanMessage } from "@langchain/core/messages";
import { OverallState } from "../configuration.js";
import { GenerateContentResponse, GroundingChunk } from "@google/genai";
import { RequestAPI } from "../api/index.js";
import { asyncPool } from "./async_pool.js";
import { TinyUrlResponse } from "../api/types.js";

export function getResearchTopic(messages: typeof OverallState.State.messages) {
  if (messages.length === 1) {
    return messages[0].content as string;
  }
  let researchTopic = ''
  for (const message of messages) {
    if (isHumanMessage(message)) {
      researchTopic += `User:${message.content}\n`;
    } else if (isAIMessage(message)) {
      researchTopic += `Assistant:${(message as AIMessage).content}\n`;
    }
  }
  return researchTopic;
}

export async function resolveUrls(groundingChunks: GroundingChunk[], id: string) {
  const tinyUrlApi = new RequestAPI({
    apiKey: process.env.TINYURL_API_KEY!,
    apiHost: "https://api.tinyurl.com"
  });
  const originalUrls = groundingChunks.reduce((acc, chunk) => {
    if (chunk.web?.uri) {
      acc.push(chunk.web.uri)
    }
    return acc;
  }, [] as string[])
  const resolvedUrls = await asyncPool(10, originalUrls, async (url) => {
    const response = await tinyUrlApi.post<{ data: TinyUrlResponse}>('/create', {
      url,
      domain: 'tinyurl.com',
      description: 'string',
    })
    return {url, shortUrl: response.data.tiny_url}
  })
  const resolvedMap = new Map<string, string>();
  for (const item of resolvedUrls) {
    resolvedMap.set(item.url, item.shortUrl)
  }
  return Object.fromEntries(resolvedMap.entries());
}

export function getCitation(response: GenerateContentResponse, resolvedUrlsMap: Record<string, string>) {
  const citations: Record<string, any>[] = []
  if (!response || !response.candidates) {
    return citations;
  }
  const candidate = response.candidates[0];
  if (!candidate.groundingMetadata || !candidate.groundingMetadata.groundingSupports) {
    return citations;
  }

  for (const support of candidate.groundingMetadata.groundingSupports) {
    const citation: Record<string, any> = {}
    if (!support.segment || !support.segment.endIndex) {
      continue;
    }
    citation.startIndex = support.segment.startIndex ?? 0;
    citation.endIndex = support.segment.endIndex;
    citation.segments = []
    if (support.groundingChunkIndices) {
      for (const chunkIndex of support.groundingChunkIndices) {
        const chunk = candidate?.groundingMetadata?.groundingChunks?.[chunkIndex];
        if (chunk?.web?.uri) {
          citation.segments.push({
            label: chunk.web.title?.split('.')[0],
            shortUrl: resolvedUrlsMap[chunk.web.uri],
            value: chunk.web.uri,
          })
        }
      }
    }
    citations.push(citation);
  }
  return citations;
}

export function insertCitationMarkers(text: string, citations: Record<string, any>[]) {
  // Sort citations by end_index in descending order.
  // If end_index is the same, secondary sort by start_index descending.
  // This ensures that insertions at the end of the string don't affect
  // the indices of earlier parts of the string that still need to be processed.
  const sortedCitations = citations.sort((a, b) => {
    if (b.endIndex === a.endIndex) {
      return b.startIndex - a.startIndex;
    }
    return b.endIndex - a.endIndex;
  });
  let modifiedText = text
  for (const citation of sortedCitations) {
    // These indices refer to positions in the *original* text,
    // but since we iterate from the end, they remain valid for insertion
    // relative to the parts of the string already processed.
    const endIndex = citation.endIndex;
    let markerToInsert = ''

    for (const segment of citation.segments) {
      markerToInsert += ` [${segment['label']}](${segment['shortUrl']})`
    }
    // Insert the citation marker at the original end_idx position
    modifiedText = modifiedText.slice(0, endIndex) + markerToInsert + modifiedText.slice(endIndex)
  }

  return modifiedText;
}
