/**
 * Main application entry point
 * Initializes the recommendation widget
 */
document.addEventListener('DOMContentLoaded', () => {
    const CONTAINER_ID = 'taboola-recommendations';
    const RECOMMENDATION_COUNT = 5;

    // Create the widget container if it doesn't exist
    let widgetContainer = document.getElementById(CONTAINER_ID);
    if (!widgetContainer) {
        widgetContainer = document.createElement('div');
        widgetContainer.id = CONTAINER_ID;
        widgetContainer.className = 'taboola-container';
        document.body.appendChild(widgetContainer);
    }

    // Initialize the Taboola API
    const taboolaApi = new TaboolaAPI();

    // Initialize the Recommendation Widget
    const recommendationWidget = new RecommendationWidget(CONTAINER_ID, taboolaApi);

    // Initialize the widget with the specified number of recommendations
    recommendationWidget.initialize(RECOMMENDATION_COUNT);
});