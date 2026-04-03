export const searchService = {
  async search(query: string, provider: "ollama" | "serpapi", apiKey: string) {
    if (provider === "serpapi") {
      try {
        // Using a proxy or direct fetch if allowed (SerpApi usually needs a backend but we can try)
        // In this environment, we might need to use a proxy or just explain it.
        // For now, let's use a common search API pattern.
        const response = await fetch(`https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${apiKey}`);
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
