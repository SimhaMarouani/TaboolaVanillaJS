// Taboola API handler
class TaboolaAPI {
    constructor() {
        this.baseUrl = 'https://api.taboola.com/1.0/json';
        this.publisherId = 'taboola-templates';
        this.appType = 'desktop';
        this.apiKey = 'f9040ab1b9c802857aa783c469d0e0ff7e7366e4';
        this.sourceId = 'demo-source';
        this.sourceType = 'video';
    }

    /**
     * Fetches recommendations from Taboola API
     * @param {number} count - Number of recommendations to fetch
     * @returns {Promise} - Promise that resolves to recommendation data
     */
    async getRecommendations(count) {
        try {
            const url = `${this.baseUrl}/${this.publisherId}/recommendations.get?app.type=${this.appType}&app.apikey=${this.apiKey}&count=${count}&source.type=${this.sourceType}&source.id=${this.sourceId}&source.url=${encodeURIComponent(window.location.href)}`;

            // Make the API request
            const response = await fetch(url);

            // Check if the request was successful
            if (!response.ok) {
                throw new Error(`API request failed with status: ${response.status}`);
            }

            // Parse the response as JSON
            const data = await response.json();

            // Filter to only sponsored recommendations
            const sponsoredRecommendations = (data.list || []).filter(item => item.origin === 'sponsored');

            // Check if we have any sponsored recommendations
            if (sponsoredRecommendations.length === 0) {
                console.warn('No sponsored recommendations found in the API response');
            }
            return sponsoredRecommendations;    // Return only the sponsored recommendations

        } catch (error) {
            console.error('Error fetching recommendations:', error);
            return [];  // Return a fallback empty array in case of error
        }
    }

    /**
     * Function to handle recommendation clicks
     * @param {Object} recommendation - The recommendation object
     * @param {Event} event - The click event
     */
    handleRecommendationClick(recommendation, event) {
        // For sponsored content, always open in a new tab
        window.open(recommendation.url, '_blank');
    }
}