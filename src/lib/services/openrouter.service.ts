import type { ChatMessage, CompletionOptions, ModelParams, ResponseFormatSchema } from "@/types";

/**
 * Configuration for OpenRouterService
 */
export interface OpenRouterServiceConfig {
  apiKey?: string; // defaults to import.meta.env.OPENROUTER_API_KEY
  baseUrl?: string; // defaults to 'https://openrouter.ai/api/v1'
  defaultModel?: string; // e.g. 'anthropic/claude-3.5-sonnet'
  defaultParams?: ModelParams;
  fetchImpl?: typeof fetch; // for testing: override global fetch
}

/**
 * OpenRouter API completion response
 */
export interface CompletionResponse {
  text: string;
  raw: unknown;
  structured?: unknown;
}

/**
 * Options for streaming chat completion
 */
export interface StreamChatOptions extends CompletionOptions {
  onToken: (token: string) => void;
  onDone?: () => void;
  onError?: (error: unknown) => void;
}

/**
 * OpenRouterService - integrates OpenRouter API (chat completions) with Astro application
 *
 * Provides:
 * - Model configuration and parameters
 * - Message building (system/user/assistant)
 * - Structured responses (response_format with JSON Schema)
 * - Input/output validation
 * - Error handling
 * - Secure API key storage
 *
 * @example
 * ```ts
 * const service = new OpenRouterService({});
 * const response = await service.completeChat([
 *   { role: "system", content: "You are a helpful assistant." },
 *   { role: "user", content: "Hello!" }
 * ], {
 *   model: "anthropic/claude-3.5-sonnet",
 *   params: { temperature: 0.7, max_tokens: 512 }
 * });
 * console.log(response.text);
 * ```
 */
export class OpenRouterService {
  private readonly apiKey: string;
  private readonly _fetch: typeof fetch;
  private readonly _baseUrl: string;
  private _defaultModel: string;
  private _defaultParams: ModelParams;

  constructor(cfg: OpenRouterServiceConfig) {
    this.apiKey = cfg.apiKey ?? import.meta.env.OPENROUTER_API_KEY;
    this._fetch = cfg.fetchImpl ?? fetch;
    this._baseUrl = cfg.baseUrl ?? "https://openrouter.ai/api/v1";
    this._defaultModel = cfg.defaultModel ?? import.meta.env.OPENROUTER_MODEL ?? "anthropic/claude-sonnet-4.5";
    this._defaultParams = cfg.defaultParams ?? { temperature: 0.2, max_tokens: 512 };
  }

  // ============================================================================
  // Public Getters
  // ============================================================================

  get baseUrl(): string {
    return this._baseUrl;
  }

  get defaultModel(): string {
    return this._defaultModel;
  }

  get defaultParams(): ModelParams {
    return { ...this._defaultParams };
  }

  // ============================================================================
  // Public Setters
  // ============================================================================

  setDefaultModel(model: string): void {
    this._defaultModel = model;
  }

  setDefaultParams(params: ModelParams): void {
    this._defaultParams = { ...params };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Creates headers for OpenRouter API requests
   * @throws {Error} If API key is not configured
   */
  private makeHeaders(): Record<string, string> {
    if (!this.apiKey) {
      throw new Error("OPENROUTER_API_KEY not configured");
    }
    return {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      "X-Title": "10x Astro Starter",
      Accept: "application/json",
    };
  }

  /**
   * Validates and merges model parameters with defaults
   * @param p - Optional parameters to validate
   * @returns Validated and merged parameters
   * @throws {Error} If parameters are invalid
   */
  private validateParams(p?: ModelParams): ModelParams {
    const merged = { ...this._defaultParams, ...(p ?? {}) };

    if (merged.temperature != null && (merged.temperature < 0 || merged.temperature > 2)) {
      throw new Error("Invalid temperature: must be between 0 and 2");
    }

    if (merged.top_p != null && (merged.top_p < 0 || merged.top_p > 1)) {
      throw new Error("Invalid top_p: must be between 0 and 1");
    }

    if (merged.max_tokens != null && merged.max_tokens <= 0) {
      throw new Error("Invalid max_tokens: must be greater than 0");
    }

    return merged;
  }

  /**
   * Builds the request payload for OpenRouter API
   * @param messages - Chat messages
   * @param opt - Completion options
   * @returns JSON string payload
   */
  private buildPayload(messages: ChatMessage[], opt?: CompletionOptions): string {
    const model = opt?.model ?? this._defaultModel;
    const params = this.validateParams(opt?.params);

    const body: Record<string, unknown> = {
      model,
      messages,
      temperature: params.temperature,
      top_p: params.top_p,
      max_tokens: params.max_tokens,
    };

    if (params.presence_penalty != null) {
      body.presence_penalty = params.presence_penalty;
    }

    if (params.frequency_penalty != null) {
      body.frequency_penalty = params.frequency_penalty;
    }

    if (opt?.response_format) {
      body.response_format = opt.response_format;
    }

    if (opt?.stream) {
      body.stream = true;
    }

    return JSON.stringify(body);
  }

  /**
   * Handles the response from OpenRouter API
   * @param resp - Fetch response
   * @param response_format - Optional response format schema
   * @returns Parsed completion response
   * @throws {Error} If response is not ok or parsing fails
   */
  private async handleResponse(resp: Response, response_format?: ResponseFormatSchema): Promise<CompletionResponse> {
    if (!resp.ok) {
      const txt = await resp.text().catch(() => "");
      throw new Error(`OpenRouter error ${resp.status}: ${txt}`);
    }

    const json = await resp.json();

    // OpenRouter returns format similar to OpenAI: choices[0].message.content
    const text: string = json?.choices?.[0]?.message?.content ?? "";

    let structured: unknown;
    if (response_format?.json_schema?.strict && text) {
      // Model usually returns JSON; try to parse
      try {
        structured = JSON.parse(text);
      } catch {
        // If parsing fails, structured remains undefined
      }
    }

    return { text, raw: json, structured };
  }

  // ============================================================================
  // Public API Methods
  // ============================================================================

  /**
   * Completes a chat conversation with OpenRouter API (non-streaming)
   *
   * @param messages - Array of chat messages
   * @param opt - Optional completion options
   * @returns Promise with completion response
   * @throws {Error} If API request fails or validation errors occur
   *
   * @example
   * ```ts
   * const response = await service.completeChat([
   *   { role: "system", content: "You are a helpful assistant." },
   *   { role: "user", content: "What is 2+2?" }
   * ], {
   *   model: "anthropic/claude-3.5-sonnet",
   *   params: { temperature: 0.2, max_tokens: 100 }
   * });
   * console.log(response.text);
   * ```
   */
  async completeChat(messages: ChatMessage[], opt?: CompletionOptions): Promise<CompletionResponse> {
    const url = `${this._baseUrl}/chat/completions`;
    const payload = this.buildPayload(messages, opt);

    const resp = await this._fetch(url, {
      method: "POST",
      headers: this.makeHeaders(),
      body: payload,
      signal: opt?.signal,
    });

    return this.handleResponse(resp, opt?.response_format);
  }

  /**
   * Streams a chat conversation with OpenRouter API (Server-Sent Events)
   *
   * @param messages - Array of chat messages
   * @param opt - Streaming options with callbacks
   * @returns Promise that resolves when stream completes
   * @throws {Error} If API request fails or streaming errors occur
   *
   * @example
   * ```ts
   * await service.streamChat([
   *   { role: "system", content: "You are a helpful assistant." },
   *   { role: "user", content: "Tell me a story." }
   * ], {
   *   model: "anthropic/claude-3.5-sonnet",
   *   params: { temperature: 0.7 },
   *   onToken: (token) => process.stdout.write(token),
   *   onDone: () => console.log("\nDone!"),
   *   onError: (err) => console.error("Error:", err)
   * });
   * ```
   */
  async streamChat(messages: ChatMessage[], opt: StreamChatOptions): Promise<void> {
    const url = `${this._baseUrl}/chat/completions`;
    const payload = this.buildPayload(messages, { ...opt, stream: true });

    const resp = await this._fetch(url, {
      method: "POST",
      headers: this.makeHeaders(),
      body: payload,
      signal: opt?.signal,
    });

    if (!resp.ok || !resp.body) {
      const txt = await resp.text().catch(() => "");
      throw new Error(`OpenRouter stream error ${resp.status}: ${txt}`);
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        // Parse SSE: lines starting with "data:"
        for (const line of chunk.split("\n")) {
          if (line.startsWith("data:")) {
            const data = line.slice(5).trim();

            if (data === "[DONE]") {
              opt.onDone?.();
              return;
            }

            try {
              const json = JSON.parse(data);
              const token: string = json?.choices?.[0]?.delta?.content ?? "";
              if (token) {
                opt.onToken(token);
              }
            } catch {
              // Ignore unparseable fragments
            }
          }
        }
      }

      opt.onDone?.();
    } catch (e) {
      opt.onError?.(e);
      throw e;
    } finally {
      reader.releaseLock();
    }
  }
}
