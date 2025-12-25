# Auto-Tagger Integration Guide

## Overview

The auto-tagger generates tags and keywords automatically when storing memories using an LLM.

## How It Works

```typescript
import { generateTags } from './auto-tagger.js';

const content = "OAuth tokens need 5min buffer before expiry";
const existingTags = ["auth", "tokens"];

const result = await generateTags(content, existingTags, {
  model: "anthropic/claude-haiku-4-5",
  apiKey: process.env.AI_GATEWAY_API_KEY!,
});

// result.tags: ["oauth", "tokens", "security", "api"]
// result.keywords: ["refresh", "expiry", "buffer", "race-condition", ...]
// result.category: "authentication"
```

## Integration with Adapter

### Current Schema (Temporary Storage)

Until `auto_tags` and `keywords` columns are added to the schema, store results in `metadata`:

```typescript
// In adapter.ts store() method, after generating embedding:

import { generateTags } from './auto-tagger.js';

// Add to adapter config
export interface MemoryConfig {
  ollamaHost: string;
  ollamaModel: string;
  autoTagConfig?: {
    enabled: boolean;
    model: string;
    apiKey: string;
  };
}

// In store() method:
async store(information: string, options: StoreOptions = {}): Promise<{ id: string }> {
  // ... existing code ...
  
  // Auto-tag if enabled
  if (this.config.autoTagConfig?.enabled) {
    try {
      const autoTagResult = await generateTags(
        information,
        parseTags(options.tags),
        {
          model: this.config.autoTagConfig.model,
          apiKey: this.config.autoTagConfig.apiKey,
        }
      );
      
      // Store in metadata (temporary until schema updated)
      metadata.auto_tags = autoTagResult.tags;
      metadata.auto_keywords = autoTagResult.keywords;
      metadata.auto_category = autoTagResult.category;
    } catch (error) {
      // Silent failure - don't block storage on auto-tag errors
      console.error("[adapter] Auto-tagging failed:", error);
    }
  }
  
  // ... rest of store logic ...
}
```

### Future Schema (Dedicated Columns)

Once the schema task adds `auto_tags` and `keywords` columns:

```typescript
// Store in dedicated columns instead of metadata
const memory: Memory = {
  id,
  content: information,
  metadata,
  collection,
  tags: parseTags(options.tags),  // User-provided tags
  auto_tags: autoTagResult.tags,  // LLM-generated tags
  keywords: autoTagResult.keywords.join(" "),  // Space-separated for FTS
  category: autoTagResult.category,
  createdAt: new Date(),
  confidence: clampConfidence(confidence),
};
```

## Performance Considerations

### Caching Strategy

For identical content, cache the result to avoid redundant LLM calls:

```typescript
// Simple in-memory cache (expand with TTL/size limits as needed)
const autoTagCache = new Map<string, AutoTagResult>();

const cacheKey = `${content.slice(0, 100)}-${existingTags?.join(",")}`;
if (autoTagCache.has(cacheKey)) {
  return autoTagCache.get(cacheKey)!;
}

const result = await generateTags(content, existingTags, config);
autoTagCache.set(cacheKey, result);
return result;
```

### Async/Background Processing

For high-volume storage, consider async tagging:

```typescript
// Store memory immediately, tag in background
const memoryId = await store.store(memory, embedding);

// Background tagging (don't await)
generateTags(content, existingTags, config)
  .then(result => {
    // Update memory with auto_tags
    db.update(memories)
      .set({ 
        metadata: JSON.stringify({ ...metadata, auto_tags: result.tags })
      })
      .where(eq(memories.id, memoryId));
  })
  .catch(err => console.error("[adapter] Background auto-tag failed:", err));

return { id: memoryId };
```

## Configuration Examples

### Minimal (Auto-tagging disabled by default)

```typescript
const adapter = createMemoryAdapter(db, {
  ollamaHost: 'http://localhost:11434',
  ollamaModel: 'mxbai-embed-large',
});
```

### With Auto-Tagging Enabled

```typescript
const adapter = createMemoryAdapter(db, {
  ollamaHost: 'http://localhost:11434',
  ollamaModel: 'mxbai-embed-large',
  autoTagConfig: {
    enabled: true,
    model: 'anthropic/claude-haiku-4-5',
    apiKey: process.env.AI_GATEWAY_API_KEY!,
  },
});
```

## Error Handling

The auto-tagger fails gracefully:
- Returns `{ tags: [], keywords: [], category: "" }` on LLM errors
- Logs errors to console for debugging
- **NEVER throws** - memory storage should succeed even if tagging fails

## Testing Integration

```typescript
// Test auto-tag integration in adapter.test.ts
test("stores memory with auto-generated tags when enabled", async () => {
  const adapter = createMemoryAdapter(db, {
    ollamaHost: 'http://localhost:11434',
    ollamaModel: 'mxbai-embed-large',
    autoTagConfig: {
      enabled: true,
      model: 'anthropic/claude-haiku-4-5',
      apiKey: process.env.AI_GATEWAY_API_KEY!,
    },
  });
  
  const { id } = await adapter.store("OAuth tokens need buffer");
  const memory = await adapter.get(id);
  
  expect(memory?.metadata.auto_tags).toBeDefined();
  expect(Array.isArray(memory?.metadata.auto_tags)).toBe(true);
  expect(memory?.metadata.auto_category).toBeDefined();
});

test("storage succeeds even when auto-tagging fails", async () => {
  const adapter = createMemoryAdapter(db, {
    ollamaHost: 'http://localhost:11434',
    ollamaModel: 'mxbai-embed-large',
    autoTagConfig: {
      enabled: true,
      model: 'invalid-model',  // Intentional error
      apiKey: 'invalid-key',
    },
  });
  
  // Should not throw - storage succeeds, auto-tagging silently fails
  const { id } = await adapter.store("Test content");
  expect(id).toBeDefined();
  
  const memory = await adapter.get(id);
  expect(memory).toBeDefined();
  expect(memory?.metadata.auto_tags).toEqual([]);  // Empty on error
});
```

## Future Enhancements

1. **Model Selection**: Support multiple models (fast vs quality)
2. **User Feedback Loop**: Learn from user tag corrections
3. **Domain-Specific Prompts**: Customize prompts per collection
4. **Batch Processing**: Tag multiple memories in one LLM call
5. **Confidence Scores**: Return confidence per tag for filtering
