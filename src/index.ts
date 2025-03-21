#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";

import * as tools from './tools/index.js';
import { hookStdout } from "./utils/stdoutRedirect.js";

// MCP Error Codes (JSON-RPC 2.0 standard)
const ErrorCodes = {
  ParseError: -32700,
  InvalidRequest: -32600,
  MethodNotFound: -32601,
  InvalidParams: -32602,
  InternalError: -32603,
  ServerError: -32000 // Erreur serveur générique
};

// Message de démarrage sur stderr, pas stdout
console.error("SMART-E2B MCP server starting...");

// Installer l'intercepteur de stdout global
// Cela doit être fait avant toute autre opération
hookStdout();

// Create an MCP server for SMART-E2B
const server = new Server(
  {
    name: "smart-e2b",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {}
    },
  }
);

// Register a handler for listing available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "executeJavaScript",
        description: "Execute JavaScript code in a secure cloud sandbox",
        inputSchema: {
          type: "object",
          properties: {
            code: { type: "string", description: "JavaScript code to execute" },
            timeout: { type: "number", description: "Timeout in milliseconds (optional)" }
          },
          required: ["code"]
        }
      },
      {
        name: "executePython",
        description: "Execute Python code in a secure cloud sandbox",
        inputSchema: {
          type: "object",
          properties: {
            code: { type: "string", description: "Python code to execute" },
            timeout: { type: "number", description: "Timeout in milliseconds (optional)" }
          },
          required: ["code"]
        }
      },
      {
        name: "uploadFile",
        description: "Upload a file to the sandbox",
        inputSchema: {
          type: "object",
          properties: {
            filePath: { type: "string", description: "Path where to save the file" },
            content: { type: "string", description: "Content of the file" }
          },
          required: ["filePath", "content"]
        }
      },
      {
        name: "listFiles",
        description: "List files in a directory in the sandbox",
        inputSchema: {
          type: "object",
          properties: {
            path: { type: "string", description: "Path to list (defaults to root)" }
          }
        }
      },
      {
        name: "readFile",
        description: "Read a file from the sandbox",
        inputSchema: {
          type: "object",
          properties: {
            filePath: { type: "string", description: "Path to the file to read" }
          },
          required: ["filePath"]
        }
      }
    ]
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args = {} } = request.params;

    switch (name) {
      case "executeJavaScript":
        return await tools.executeJavaScript(args as any);
      case "executePython":
        return await tools.executePython(args as any);
      case "uploadFile":
        return await tools.uploadFile(args as any);
      case "listFiles":
        return await tools.listFiles(args as any);
      case "readFile":
        return await tools.readFile(args as any);
      default:
        throw new McpError(
          ErrorCodes.MethodNotFound,
          `Tool not found: ${name}`
        );
    }
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    
    console.error("Tool execution error:", error);
    throw new McpError(
      ErrorCodes.InternalError,
      typeof error === "object" && error !== null && "message" in error
        ? String(error.message)
        : "Unknown error occurred during tool execution"
    );
  }
});

// Start the server with stdio transport
const transport = new StdioServerTransport();
server.connect(transport).catch((err) => {
  console.error("Server error:", err);
  process.exit(1);
});

console.error("SMART-E2B MCP server started");
