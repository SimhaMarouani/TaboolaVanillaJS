/**
 * Recommendation Widget class
 * Responsible for rendering and managing the recommendation widget
 */
class RecommendationWidget {
    /**
     * Constructor for the Recommendation Widget
     * @param {string} containerId - The ID of the container element
     * @param {TaboolaAPI} api - The TaboolaAPI instance
     */
    constructor(containerId, api) {
        this.containerId = containerId;
        this.api = api;
        this.container = document.getElementById(containerId);
        this.recommendations = [];
        this.maxRetries = 5;    // Maximum number of fetch retries to prevent infinite loops
        this.retryCount = 0;    // Counter for retry attempts
        this.retryDelay = 1000; // Time in ms between retries
        this.isMobileView = window.innerWidth <= 750; // Track if we're in mobile view
        this.scrollHandlers = []; // Keep track of scroll handlers to avoid duplicates
        this.activeReplacements = new Set(); // Track currently active replacements
    }

    /**
     * Initialize the widget by fetching and rendering recommendations
     * @param {number} count - Number of recommendations to fetch
     * @param {boolean} isRetry - Whether this is a retry attempt
     */
    async initialize(count = 4, isRetry = false) {
        try {
            if (!isRetry) {
                this.retryCount = 0;
            }

            // Create widget structure if it doesn't exist
            if (!this.gridElement) {
                this.createWidgetStructure();
            }

            // Hide error message if it was displayed
            if (this.errorElement) {
                this.errorElement.style.display = 'none';
            }

            // Show loading state
            this.showLoading(true);

            // Fetch recommendations
            this.recommendations = await this.api.getRecommendations(count);

            // If no recommendations and we're under max retries, try again
            if ((!this.recommendations || this.recommendations.length === 0) && this.retryCount < this.maxRetries) {
                this.retryCount++;

                // Wait a bit before retrying
                setTimeout(() => {
                    this.initialize(count, true);
                }, this.retryDelay);
                return;
            }

            // Render recommendations (will handle empty case if max retries reached)
            this.renderRecommendations();

            // Hide loading state
            this.showLoading(false);

            // Initialize mobile-specific features
            this.initializeMobileFeatures();

            // Add resize listener to handle responsive changes
            this.addResizeListener();
        } catch (error) {
            console.error('Error initializing widget:', error);
            this.showError('Failed to load recommendations. Please try again later.');
        }
    }

    /**
     * Creates the basic structure of the widget
     */
    createWidgetStructure() {
        if (!this.container) {
            console.error(`Container with ID "${this.containerId}" not found`);
            return;
        }

        // Add toggle button for mobile view with arrow
        const toggleButton = this.isMobileView ?
            `<button class="taboola-toggle" aria-label="Toggle recommendations"><span class="toggle-arrow down"></span></button>` : '';

        this.container.innerHTML = `
            <div class="taboola-header">
                <h2>Sponsored Content</h2>
                ${toggleButton}
            </div>
            <div class="taboola-content">
                <div class="taboola-loading">Loading recommendations...</div>
                <div class="taboola-error" style="display: none;"></div>
                <div class="taboola-grid"></div>
            </div>
        `;

        // Cache DOM elements for later use
        this.gridElement = this.container.querySelector('.taboola-grid');
        this.loadingElement = this.container.querySelector('.taboola-loading');
        this.errorElement = this.container.querySelector('.taboola-error');

        // Ensure loading is hidden initially if we already have data
        if (this.recommendations && this.recommendations.length > 0) {
            this.showLoading(false);
        }
    }

    /**
     * Shows or hides the loading indicator with optional retry information
     * @param {boolean} isLoading - Whether to show or hide loading
     */
    showLoading(isLoading) {
        if (this.loadingElement) {
            if (isLoading) {
                this.loadingElement.innerHTML = 'Loading recommendations...';
                this.loadingElement.style.display = 'flex';
            } else {
                this.loadingElement.style.display = 'none';

                // Show grid when not loading
                if (this.gridElement) {
                    this.gridElement.style.display = this.isMobileView ? 'flex' : 'grid';
                }
            }
        }
    }

    /**
     * Shows an error message in the widget
     * @param {string} message - The error message to display
     */
    showError(message) {
        this.showLoading(false);
        if (this.errorElement) {
            this.errorElement.innerHTML = `
                <p>${message}</p>
                <button class="refresh-button">Try Again</button>
            `;
            this.errorElement.style.display = 'flex';

            // Add event listener to the try again button
            const refreshButton = this.errorElement.querySelector('.refresh-button');
            if (refreshButton) {
                refreshButton.addEventListener('click', () => {
                    this.initialize(5);
                });
            }
        }
    }

    /**
     * Renders the recommendations in the widget
     */
    renderRecommendations() {
        if (!this.gridElement) {
            // If no grid element, show an error
            this.showError('Widget container not found.');
            return;
        }
        // Clear the grid
        this.gridElement.innerHTML = '';

        // Check if we have any recommendations
        if (!this.recommendations || this.recommendations.length === 0) {
            if (this.retryCount >= this.maxRetries) {
                this.showEmptyState();
            }
            return;
        }

        // For each recommendation, create a recommendation item
        this.recommendations.forEach(recommendation => {
            const item = this.createRecommendationItem(recommendation);
            this.gridElement.appendChild(item);
        });

        // Ensure grid has proper display style
        this.gridElement.style.display = this.isMobileView ? 'flex' : 'grid';
    }

    /**
     * Shows an empty state message when no recommendations are available
     */
    showEmptyState() {
        const emptyStateElement = document.createElement('div');
        emptyStateElement.className = 'taboola-empty-state';
        emptyStateElement.innerHTML = `
            <p>No sponsored content available at the moment.</p>
            <button class="refresh-button">Try Again</button>
        `;

        // Add event listener to refresh button
        const refreshButton = emptyStateElement.querySelector('.refresh-button');
        refreshButton.addEventListener('click', (event) => {
            // Prevent default action to avoid any link behavior
            event.preventDefault();
            event.stopPropagation();

            // Clear the grid and show loading before initializing
            this.gridElement.innerHTML = '';
            this.showLoading(true);

            // Reset retry count and initialize
            this.retryCount = 0;
            this.initialize(5);
        });

        // Add to grid
        this.gridElement.appendChild(emptyStateElement);
    }

    /**
     * Creates a DOM element for a single recommendation
     * @param {Object} recommendation - The recommendation object
     * @returns {HTMLElement} - The recommendation DOM element
     */
    createRecommendationItem(recommendation) {
        // Create a div for the recommendation
        const item = document.createElement('div');

        // Add appropriate classes
        item.className = 'recommendation-item';

        // Add a data attribute to identify the recommendation
        item.dataset.recommendationId = recommendation.id;

        // Get the thumbnail image URL (use the first one if available)
        const thumbnailUrl = recommendation.thumbnail && recommendation.thumbnail.length > 0
            ? recommendation.thumbnail[0].url
            : 'https://via.placeholder.com/300x200?text=No+Image';

        // Format the HTML for the recommendation item
        item.innerHTML = `
            <div class="recommendation-close">✕</div>
            <img src="${thumbnailUrl}" alt="${recommendation.name}" />
            <div class="recommendation-title">${recommendation.name}</div>
            ${recommendation.branding ? `<span class="recommendation-branding">${recommendation.branding}</span>` : ''}
        `;

        // Add click event listener for the recommendation
        item.addEventListener('click', (event) => {
            // Don't handle click if the close button was clicked
            if (!event.target.closest('.recommendation-close')) {
                this.handleRecommendationClick(recommendation, event);
            }
        });

        // Add event listener for the close button
        const closeButton = item.querySelector('.recommendation-close');
        closeButton.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent the recommendation click event
            this.removeAndReplaceRecommendation(item, recommendation);
        });

        return item;
    }

    /**
     * Handles clicks on recommendation items
     * @param {Object} recommendation - The recommendation object
     * @param {Event} event - The click event
     */
    handleRecommendationClick(recommendation, event) {
        // Prevent default action
        event.preventDefault();
        // Delegate to the API handler for proper action
        this.api.handleRecommendationClick(recommendation, event);
    }

    /**
     * Removes a recommendation and replaces it with a new one
     * @param {HTMLElement} itemElement - The recommendation DOM element to remove
     * @param {Object} oldRecommendation - The recommendation being removed
     */
    async removeAndReplaceRecommendation(itemElement, oldRecommendation) {
        // Check if we already have a replacement in progress for this item
        const recommendationId = oldRecommendation.id;
        if (this.activeReplacements.has(recommendationId)) {
            console.warn('Replacement already in progress for this item, ignoring duplicate request');
            return;
        }

        // Add to active replacements set
        this.activeReplacements.add(recommendationId);

        // Create a unique loading ID for this element
        const loadingId = `loading-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        itemElement.dataset.loadingId = loadingId;

        // Show a loading indicator in place of the item
        itemElement.innerHTML = `<div class="recommendation-loading">Loading...</div>`;
        itemElement.style.cursor = 'default';
        itemElement.style.transform = 'none';

        try {
            // Fetch a single new recommendation
            let newRecommendations = [];
            let retryCount = 0;

            // Keep fetching until we get at least one recommendation or hit max retries
            while ((!newRecommendations || newRecommendations.length === 0) && retryCount < this.maxRetries) {
                newRecommendations = await this.api.getRecommendations(1);
                if (!newRecommendations || newRecommendations.length === 0) {
                    retryCount++;
                    // Wait a bit before retrying
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }

            // Check if the element still exists and has the same loading ID
            // This ensures we don't replace an element that has already been replaced
            const currentElement = this.gridElement.querySelector(`[data-recommendation-id="${recommendationId}"]`);
            if (!currentElement || currentElement.dataset.loadingId !== loadingId) {
                console.warn('Element was already replaced or removed, aborting replacement');
                this.activeReplacements.delete(recommendationId);
                return;
            }

            if (newRecommendations && newRecommendations.length > 0) {
                let newRecommendation = newRecommendations[0];

                // Ensure we're not getting the same recommendation
                if (newRecommendation.id === oldRecommendation.id && newRecommendations.length > 1) {
                    newRecommendation = newRecommendations[1];
                }

                // Create a new recommendation item
                const newItem = this.createRecommendationItem(newRecommendation);

                // Replace the old item with the new one
                if (currentElement.parentNode) {
                    currentElement.parentNode.replaceChild(newItem, currentElement);
                }

                // Add the new recommendation to our list (replace the old one)
                const index = this.recommendations.findIndex(rec => rec.id === oldRecommendation.id);
                if (index !== -1) {
                    this.recommendations[index] = newRecommendation;
                }
            } else {
                // No new recommendations could be fetched after retries
                // Show error with retry button instead of staying in loading state
                this.showReplacementError(currentElement, oldRecommendation);
            }
        } catch (error) {
            console.error('Error replacing recommendation:', error);

            // Check if the element still exists and has the same loading ID
            const currentElement = this.gridElement.querySelector(`[data-recommendation-id="${recommendationId}"]`);
            if (!currentElement || currentElement.dataset.loadingId !== loadingId) {
                console.warn('Element was already replaced or removed, aborting error display');
                this.activeReplacements.delete(recommendationId);
                return;
            }

            // Show error in the item
            this.showReplacementError(currentElement, oldRecommendation);
        } finally {
            // Always remove from active replacements set, even if error occurred
            this.activeReplacements.delete(recommendationId);
        }
    }

    /**
     * Shows error UI for a recommendation that couldn't be replaced
     * @param {HTMLElement} element - The recommendation DOM element
     * @param {Object} oldRecommendation - The original recommendation
     */
    showReplacementError(element, oldRecommendation) {
        element.innerHTML = `
            <div class="recommendation-error">
                <p>Failed to load new recommendation</p>
                <button class="recommendation-retry">Try Again</button>
            </div>
        `;

        // Add event listener to retry button
        const retryButton = element.querySelector('.recommendation-retry');
        retryButton.addEventListener('click', (event) => {
            // Prevent default action to avoid any link behavior
            event.preventDefault();
            event.stopPropagation();

            // Display loading state again
            element.innerHTML = `<div class="recommendation-loading">Loading...</div>`;

            // Attempt to replace the recommendation again
            this.removeAndReplaceRecommendation(element, oldRecommendation);
        });
    }

    // Mobile-specific methods are in mobile.js
    initializeMobileFeatures() {
        if (typeof this.initMobileFeatures === 'function') {
            this.initMobileFeatures();
        }
    }

    addResizeListener() {
        if (typeof this.addMobileResizeListener === 'function') {
            this.addMobileResizeListener();
        }
    }
}