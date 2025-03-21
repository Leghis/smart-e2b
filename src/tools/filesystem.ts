import { Sandbox } from '@e2b/code-interpreter';
import { McpError } from "@modelcontextprotocol/sdk/types.js";
import { withRedirectedStdout } from '../utils/stdoutRedirect.js';
import { withPipeErrorHandling } from '../utils/errorHandling.js';

// MCP Error Codes (JSON-RPC 2.0 standard)
const ErrorCodes = {
  ParseError: -32700,
  InvalidRequest: -32600,
  MethodNotFound: -32601,
  InvalidParams: -32602,
  InternalError: -32603,
  ServerError: -32000 // Erreur serveur générique
};

// Cache pour les sessions sandbox
const sandboxCache = new Map<string, { sandbox: Sandbox, lastUsed: number }>();

// Fonction utilitaire pour obtenir un sandbox
async function getSandbox(sandboxId = 'default-fs'): Promise<Sandbox> {
  let sandboxEntry = sandboxCache.get(sandboxId);
  
  if (!sandboxEntry) {
    // Utiliser withRedirectedStdout pour éviter que les messages de débogage d'E2B 
    // n'interfèrent avec le protocole JSON-RPC
    return await withRedirectedStdout(async () => {
      console.error(`Creating new filesystem sandbox with ID: ${sandboxId}`);
      const sandbox = await Sandbox.create({ 
        apiKey: process.env.E2B_API_KEY,
        // Augmenter le délai d'expiration du sandbox à 1 heure
        timeoutMs: 60 * 60 * 1000 // 1 heure
      });
      
      sandboxEntry = { sandbox, lastUsed: Date.now() };
      sandboxCache.set(sandboxId, sandboxEntry);
      
      return sandbox;
    });
  } else {
    sandboxEntry.lastUsed = Date.now();
    
    // Actualiser le délai d'expiration du sandbox
    if (sandboxEntry.sandbox.setTimeout) {
      await sandboxEntry.sandbox.setTimeout(60 * 60 * 1000); // 1 heure
    }
    
    return sandboxEntry.sandbox;
  }
}

/**
 * Téléverse un fichier dans le sandbox
 */
export async function uploadFile(args: { filePath: string, content: string, sandboxId?: string }) {
  const { filePath, content, sandboxId } = args;

  try {
    // Utiliser withPipeErrorHandling pour gérer les erreurs EPIPE
    return await withPipeErrorHandling(async () => {
      const sandbox = await getSandbox(sandboxId);
      
      // Exécuter les opérations de fichier avec redirection stdout
      return await withRedirectedStdout(async () => {
        // Créer les répertoires parents si nécessaire
        const pathParts = filePath.split('/');
        if (pathParts.length > 1) {
          const dirPath = pathParts.slice(0, -1).join('/');
          
          // La nouvelle API ne prend pas recursive comme option directe
          // Nous devons créer chaque répertoire parent manuellement
          let currentPath = '';
          for (const part of dirPath.split('/').filter(Boolean)) {
            currentPath = currentPath ? `${currentPath}/${part}` : part;
            try {
              await sandbox.files.makeDir(currentPath);
            } catch (error) {
              // Ignorer les erreurs si le répertoire existe déjà
            }
          }
        }

        // Écrire le fichier
        await sandbox.files.write(filePath, content);

        return { 
          toolResult: {
            success: true,
            message: `File uploaded successfully to ${filePath}`
          }
        };
      });
    }, {
      toolResult: {
        success: false,
        message: "Connexion interrompue. Le client s'est déconnecté pendant l'opération sur les fichiers."
      }
    });
  } catch (error) {
    console.error("File upload error:", error);
    throw new McpError(
      ErrorCodes.InternalError,
      typeof error === "object" && error !== null && "message" in error
        ? String(error.message)
        : "Failed to upload file"
    );
  }
}

/**
 * Liste les fichiers dans un répertoire du sandbox
 */
export async function listFiles(args: { path?: string, sandboxId?: string }) {
  const { path = '/', sandboxId } = args;

  try {
    // Utiliser withPipeErrorHandling pour gérer les erreurs EPIPE
    return await withPipeErrorHandling(async () => {
      const sandbox = await getSandbox(sandboxId);
      
      // Exécuter les opérations de fichier avec redirection stdout
      return await withRedirectedStdout(async () => {
        const files = await sandbox.files.list(path);

        return { 
          toolResult: {
            files: files.map(file => ({
              name: file.name,
              // Adaptation pour le type de fichier 
              isDir: typeof file.type === 'string' ? file.type.includes('dir') : false,
              // Supprime complètement la référence à size qui n'existe pas
              path: file.path
            }))
          }
        };
      });
    }, {
      toolResult: {
        files: []
      }
    });
  } catch (error) {
    console.error("List files error:", error);
    throw new McpError(
      ErrorCodes.InternalError,
      typeof error === "object" && error !== null && "message" in error
        ? String(error.message)
        : "Failed to list files"
    );
  }
}

/**
 * Lit un fichier depuis le sandbox
 */
export async function readFile(args: { filePath: string, sandboxId?: string }) {
  const { filePath, sandboxId } = args;

  try {
    // Utiliser withPipeErrorHandling pour gérer les erreurs EPIPE
    return await withPipeErrorHandling(async () => {
      const sandbox = await getSandbox(sandboxId);
      
      // Exécuter les opérations de fichier avec redirection stdout
      return await withRedirectedStdout(async () => {
        const content = await sandbox.files.read(filePath);

        return { 
          toolResult: {
            content,
            filePath
          }
        };
      });
    }, {
      toolResult: {
        content: "Connexion interrompue. Le client s'est déconnecté pendant la lecture du fichier.",
        filePath
      }
    });
  } catch (error) {
    console.error("Read file error:", error);
    throw new McpError(
      ErrorCodes.InternalError,
      typeof error === "object" && error !== null && "message" in error
        ? String(error.message)
        : "Failed to read file"
    );
  }
}

// Nettoyage périodique des sandbox inutilisées (après 30 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [id, { sandbox, lastUsed }] of sandboxCache.entries()) {
    if (now - lastUsed > 30 * 60 * 1000) {
      console.error(`Closing unused filesystem sandbox ${id}`);
      try {
        // Dans la nouvelle version, on utilise kill() au lieu de destroy()
        sandbox.kill && sandbox.kill();
      } catch (err) {
        console.error("Error while closing sandbox:", err);
      }
      sandboxCache.delete(id);
    }
  }
}, 60 * 1000); // Vérifier toutes les minutes
