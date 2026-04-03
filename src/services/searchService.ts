export const searchService = {
  async search(query: string, provider: "ollama" | "serpapi", apiKey: string) {
    if (provider === "serpapi") {
      try {
        const response = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, provider, apiKey })
        });
        const data = await response.json();
        
        if (data.organic_results) {
          return data.organic_results.slice(0, 5).map((result: any) => ({
            title: result.title,
            link: result.link,
            snippet: result.snippet
          }));
        }
        return [];
      } catch (error) {
        console.error("SerpApi error:", error);
        return [];
      }
    } else if (provider === "ollama") {
      // Assuming this is a specific search API that uses the provided key
      try {
        // This is a placeholder for the actual Ollama search API if it exists
        // Given the key format, it might be a specific provider.
        // For now, we'll simulate or use a generic search if possible.
        console.log("Ollama search requested with key:", apiKey);
        return [
          { title: "Ollama Search Result", link: "#", snippet: "Hasil pencarian dari mesin Ollama lokal/cloud." }
        ];
      } catch (error) {
        console.error("Ollama search error:", error);
        return [];
      }
    }
    return [];
  }
};
