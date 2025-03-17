// Taboola API handler
class TaboolaAPI {
    constructor() {
        this.baseUrl = 'https://api.taboola.com/1.0/json';
        this.publisherId = 'taboola-templates';
        this.appType = 'desktop';
        this.apiKey = 'f9040ab1b9c802857aa783c469d0e0ff7e7366e4';
        this.sourceId = 'demo-source';
        this.sourceType = 'video';
        this.maxRetries = 5;    // Maximum retry attempts
        this.retryDelay = 1000; // Time in ms between retries
    }

    /**
     * Fetches recommendations from Taboola API with retry logic
     * @param {number} count - Number of recommendations to fetch
     * @returns {Promise<Array>} - Promise resolving to an array of sponsored recommendations
     */
    async getRecommendations(count) {
        const url = `${this.baseUrl}/${this.publisherId}/recommendations.get?app.type=${this.appType}&app.apikey=${this.apiKey}&count=${count}&source.type=${this.sourceType}&source.id=${this.sourceId}&source.url=${encodeURIComponent(window.location.href)}`;

        for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
            try {
                const response = await fetch(url);

                if (!response.ok) {
                    throw new Error(`API request failed with status: ${response.status}`);
                }

                const data = await response.json();

                // Filter for only sponsored recommendations
                const sponsoredRecommendations = (data.list || []).filter(item => item.origin === 'sponsored');

                if (sponsoredRecommendations.length > 0) {
                    return sponsoredRecommendations; // Success, return recommendations
                }
                console.warn(`Attempt ${attempt + 1}: No sponsored recommendations found.`);    //for debug
            } catch (error) {
                console.error(`Attempt ${attempt + 1}: Error fetching recommendations:`, error);
            }

            if (attempt < this.maxRetries) {
                await new Promise(resolve => setTimeout(resolve, this.retryDelay)); // Wait before retrying
            }
        }

        console.warn('Max retries reached. Returning an empty array.');
        return []; // Return an empty array after max retries
    }

    /**
     * Handles recommendation clicks
     * @param {Object} recommendation - The recommendation object
     * @param {Event} event - The click event
     */
    handleRecommendationClick(recommendation, event) {
        // For sponsored content, always open in a new tab
        window.open(recommendation.url, '_blank');
    }
}
