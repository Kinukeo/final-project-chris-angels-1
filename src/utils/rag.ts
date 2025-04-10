/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, prefer-const */

import { Pinecone } from "@pinecone-database/pinecone";
import { OpenAIEmbeddings } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
import { OpenAI } from "openai";
import { mixedContentItems } from "@/app/about/Memory";

// type object
interface ContentItem {
  type: "image" | "text" | "audio" | "video";
  title: string;
  content: string;
  description?: string;
}

// Prepare data in a format that's easy for the LLM to process
const marthaData = mixedContentItems.map((content: ContentItem) => ({
  type: content.type,
  title: content.title,
  content: content.content,
  description: content.description,
}));

// Initialize Pinecone client
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Initialize embeddings model
const embeddings = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: "text-embedding-3-small", // or another preferred model
});

// Get the Pinecone index
const index = pinecone.Index(process.env.PINECONE_INDEX_NAME!);

/**
 * Convert text to vector embeddings
 */
export async function getEmbeddings(text: string) {
  const result = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return result.data[0].embedding;
}

/**
 * Populate Pinecone with Martha's data
 */
export async function populateMarthaData() {
  try {
    console.log("Starting to populate Martha's data...");

    // Check environment variables
    if (!process.env.PINECONE_API_KEY) {
      throw new Error(
        "PINECONE_API_KEY is not defined in environment variables",
      );
    }
    if (!process.env.PINECONE_INDEX_NAME) {
      throw new Error(
        "PINECONE_INDEX_NAME is not defined in environment variables",
      );
    }
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not defined in environment variables");
    }

    // For each content item, create an embedding and store it
    for (const item of mixedContentItems) {
      // Create a comprehensive text representation of this item
      let textContent = `${item.title}: `;

      if (item.type === "text") {
        textContent += item.content;
      } else {
        textContent += item.description || "";
      }

      // Add metadata that will help with retrieval
      const metadata = {
        type: item.type,
        title: item.title,
        text: textContent, // This is crucial - the full text needs to be in metadata
        content_type: item.type,
      };

      // Generate a consistent ID so we can update rather than duplicate
      const id = `martha-${item.title.toLowerCase().replace(/\s+/g, "-")}`;

      // Get the embedding
      const embedding = await getEmbeddings(textContent);

      // Upsert to Pinecone
      await index.upsert([
        {
          id,
          values: embedding,
          metadata,
        },
      ]);

      console.log(`Added "${item.title}" to vector database`);
    }

    console.log("Martha's data population complete!");
    return true;
  } catch (error) {
    console.error("Error populating Martha's data:", error);
    throw error;
  }
}

/**
 * Search for similar content in Pinecone
 */
export async function searchVectorDB(query: string, topK: number = 3) {
  try {
    // Get query embeddings
    const queryEmbedding = await getEmbeddings(query);

    // Search the index
    const results = await index.query({
      vector: queryEmbedding,
      topK,
      includeMetadata: true,
    });

    return results.matches;
  } catch (error) {
    console.error("Error searching vector database:", error);
    throw error;
  }
}

/**
 * Generate a response using retrieved context and user query
 */
export async function generateResponse(query: string, context: string[]) {
  try {
    const contextText = context.join("\n\n");

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo", // or any other preferred model
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant named Martha's Memory Assistant. 
      
          When users ask questions about Martha (such as her age, family, or activities), ALWAYS use the provided context to answer. 
          
          Martha is a real person whose information is in the context. Do NOT respond with generic AI disclaimers about not having access to personal data, as Martha's data is provided in the context.
          
          When questions are asked about "you" or "your age", interpret them as questions about Martha Wilson.
    
          ### MARTHA'S PERSONAL INFORMATION
          ${JSON.stringify(marthaData, null, 2)}
    
          ### CONTEXT FROM USER QUERY
          ${contextText}`,
        },
        {
          role: "user",
          content: query,
        },
      ],
      temperature: 0.5,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error("Error generating response:", error);
    throw error;
  }
}

/**
 * Add documents to the vector database
 */
export async function addDocumentToVectorDB(text: string, metadata: any = {}) {
  try {
    const embedding = await getEmbeddings(text);

    await index.upsert([
      {
        id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        values: embedding,
        metadata: {
          text,
          ...metadata,
        },
      },
    ]);

    return true;
  } catch (error) {
    console.error("Error adding document to vector database:", error);
    throw error;
  }
}

/**
 * Process a user query through the RAG pipeline
 */
export async function processQuery(query: string) {
  try {
    // Add specific query augmentation for personal questions
    let searchQuery = query;

    // If asking about age or personal details, augment the query
    if (
      query.toLowerCase().includes("age") ||
      query.toLowerCase().includes("old") ||
      query.toLowerCase().includes("birthday") ||
      query.toLowerCase().includes("born")
    ) {
      searchQuery = `${query} Martha Wilson personal information`;
    }

    // Search with the augmented query
    const searchResults = await searchVectorDB(searchQuery);

    // Extract text from search results
    const context = searchResults
      .filter((result) => result.metadata && result.metadata.text)
      .map((result) => result.metadata?.text as string);

    // If no relevant context found, just use OpenAI directly
    if (context.length === 0) {
      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo",
        messages: [
          {
            role: "system",
            content: `You are Martha's Memory Assistant. Answer as if you are helping Martha Wilson. 
            Martha is 68 years old, a retired elementary school teacher, married to Robert for 45 years, 
            with five grandchildren. When users ask about "you" or "your age", respond with Martha's information.`,
          },
          {
            role: "user",
            content: query,
          },
        ],
        temperature: 0.7,
      });

      return completion.choices[0].message.content;
    }

    // Generate a response using the context
    return await generateResponse(query, context);
  } catch (error) {
    console.error("Error processing query:", error);
    throw error;
  }
}
