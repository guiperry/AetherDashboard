
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Thought, Memory, AgentStatus } from "../types";
import { PersistenceService } from "./persistence";

export class GeminiAgentService {
  private ai: GoogleGenAI;
  private modelName = "gemini-3-pro-preview";
  private imageModel = "gemini-2.5-flash-image";
  private videoModel = "veo-3.1-fast-generate-preview";

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async planAndExecute(
    goal: string, 
    memories: Memory[], 
    onThought: (thought: Thought) => void,
    onStatusChange: (status: AgentStatus) => void
  ): Promise<string> {
    onStatusChange(AgentStatus.THINKING);
    
    // Sort memories by importance for context prioritization
    const sortedMemories = [...memories].sort((a, b) => b.importance - a.importance);
    const context = sortedMemories.slice(0, 15).map(m => `[${m.type.toUpperCase()}] ${m.content}`).join('\n');
    
    const systemPrompt = `
      You are Aether, an ultra-advanced Autonomous Intelligence Agent with long-term recursive memory.
      Current Time: ${new Date().toLocaleString()}
      
      CORE ARCHITECTURE:
      1. PERSISTENT MEMORY: You have access to previous facts and instructions. Use them to maintain consistency.
      2. HEURISTIC REASONING: Deconstruct complex goals into logical verification steps.
      3. TOOL INTEGRATION: Use Google Search for real-time verification.
      
      CONTEXTUAL MEMORY RETRIEVAL:
      ${context}

      MISSION OPERATING PROCEDURES:
      - PHASE:PLAN -> Analyze constraints and define atomic sub-tasks.
      - PHASE:OBSERVE -> Gather data and identify patterns.
      - PHASE:ACT -> Execute logic or generate synthesis.
      - PHASE:LEARN -> Extract insights for future sessions.
      
      Output your internal monologue clearly marked with "THOUGHT:" before providing the final "RESULT:".
    `;

    try {
      // Create a fresh instance for the latest key
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: this.modelName,
        contents: goal,
        config: {
          systemInstruction: systemPrompt,
          thinkingConfig: { thinkingBudget: 32768 },
          tools: [{ googleSearch: {} }]
        },
      });

      onStatusChange(AgentStatus.EXECUTING);
      
      const rawText = response.text || "";
      
      // Heuristic: Extract thoughts from the text if present
      const thoughtsMatch = rawText.match(/THOUGHT:([\s\S]*?)(?=RESULT:|$)/i);
      if (thoughtsMatch && thoughtsMatch[1]) {
        const thoughtContent = thoughtsMatch[1].trim();
        onThought({
          id: PersistenceService.generateId(thoughtContent),
          timestamp: Date.now(),
          content: thoughtContent,
          type: 'observation'
        });
      }

      const resultMatch = rawText.match(/RESULT:([\s\S]*)/i);
      const finalOutput = resultMatch ? resultMatch[1].trim() : rawText;
      
      onThought({
        id: PersistenceService.generateId(`Objective Completed: ${goal.substring(0, 30)}`),
        timestamp: Date.now(),
        content: `Objective Completed: ${goal.substring(0, 30)}...`,
        type: 'conclusion'
      });

      return finalOutput;
    } catch (error) {
      console.error("Agent Execution Error:", error);
      onStatusChange(AgentStatus.ERROR);
      onThought({
        id: PersistenceService.generateId(`CRITICAL_ERROR: ${error instanceof Error ? error.message : 'Unknown failure'}`),
        timestamp: Date.now(),
        content: `CRITICAL_ERROR: ${error instanceof Error ? error.message : 'Unknown failure'}`,
        type: 'error'
      });
      return "Critical failure in reasoning engine. Please check API credentials and network status.";
    }
  }

  async generateImage(prompt: string, aspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9" = "1:1"): Promise<string | null> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: this.imageModel,
        contents: { parts: [{ text: prompt }] },
        config: { imageConfig: { aspectRatio } }
      });

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
      return null;
    } catch (error) {
      console.error("Image Generation Error:", error);
      return null;
    }
  }

  async editImage(base64Image: string, prompt: string, mimeType: string): Promise<string | null> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: this.imageModel,
        contents: {
          parts: [
            { inlineData: { data: base64Image, mimeType } },
            { text: prompt }
          ]
        }
      });

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
      return null;
    } catch (error) {
      console.error("Image Edit Error:", error);
      return null;
    }
  }

  async generateVideo(prompt: string, config: { resolution: '720p' | '1080p', aspectRatio: '16:9' | '9:16' }): Promise<string | null> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      let operation = await ai.models.generateVideos({
        model: this.videoModel,
        prompt: prompt,
        config: {
          numberOfVideos: 1,
          resolution: config.resolution,
          aspectRatio: config.aspectRatio
        }
      });

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (!downloadLink) return null;

      const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
      const blob = await videoResponse.blob();
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error("Video Generation Error:", error);
      return null;
    }
  }

  async generateMemoryInsight(thoughts: Thought[]): Promise<Memory[]> {
    const text = thoughts.map(t => t.content).join('\n');
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Extract semantic knowledge from these neural logs for long-term storage:\n${text}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              content: { type: Type.STRING },
              type: { 
                type: Type.STRING,
                description: "The category of the insight: 'fact', 'instruction', 'observation', or 'insight'"
              },
              importance: { type: Type.NUMBER, description: "Importance from 0.0 to 1.0" }
            },
            required: ['content', 'type', 'importance']
          }
        }
      }
    });

    try {
      const insights = JSON.parse(response.text || "[]");
      return insights.map((i: any) => ({
        ...i,
        id: PersistenceService.generateId(i.content),
        timestamp: Date.now()
      }));
    } catch {
      return [];
    }
  }
}
