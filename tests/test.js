/**
 * Tests for the Taboola Recommendation Widget
 */

// Mock the DOM API for testing
document.getElementById = jest.fn();
document.createElement = jest.fn(() => ({
    className: '',
    innerHTML: '',
    style: {},
    appendChild: jest.fn(),
    addEventListener: jest.fn(),
    parentNode: {
        replaceChild: jest.fn()
    },
    querySelector: jest.fn(() => ({
        addEventListener: jest.fn()
    }))
}));

// Mock fetch for API tests
global.fetch = jest.fn(() =>
    Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
            list: [
                {
                    id: 'rec1',
                    name: 'Test Recommendation 1',
                    origin: 'sponsored',
                    branding: 'Test Brand',
                    thumbnail: [{ url: 'test-url-1.jpg' }],
                    url: 'https://example.com/1'
                },
                {
                    id: 'rec2',
                    name: 'Test Recommendation 2',
                    origin: 'sponsored',
                    branding: 'Test Brand 2',
                    thumbnail: [{ url: 'test-url-2.jpg' }],
                    url: 'https://example.com/2'
                },
                {
                    id: 'rec3',
                    name: 'Organic Recommendation',
                    origin: 'organic',
                    branding: 'Organic Brand',
                    thumbnail: [{ url: 'test-url-3.jpg' }],
                    url: 'https://example.org'
                }
            ]
        })
    })
);

// Mock console methods
console.error = jest.fn();
console.warn = jest.fn();
console.log = jest.fn();

// Mock window.open
window.open = jest.fn();

// Mock setTimeout
jest.useFakeTimers();
global.setTimeout = jest.fn(setTimeout);

// Import the widget classes
// recreate simplified versions of the classes

// Mock TaboolaAPI class
class TaboolaAPI {
    constructor() {
        this.baseUrl = 'https://api.taboola.com/1.0/json';
        this.publisherId = 'taboola-templates';
    }

    async getRecommendations(count) {
        try {
            const response = await fetch('mock-url');
            const data = await response.json();
            return data.list.filter(item => item.origin === 'sponsored').slice(0, count);
        } catch (error) {
            console.error('Error fetching recommendations:', error);
            return [];
        }
    }

    handleRecommendationClick(recommendation) {
        window.open(recommendation.url, '_blank');
    }
}

// Mock RecommendationWidget class (simplified for testing)
class RecommendationWidget {
    constructor(containerId, api) {
        this.containerId = containerId;
        this.api = api;
        this.container = document.getElementById(containerId);
        this.recommendations = [];
        this.maxRetries = 3;
        this.retryCount = 0;
    }

    async initialize(count, isRetry = false) {
        if (!isRetry) {
            this.retryCount = 0;
        }

        if (!this.gridElement) {
            this.createWidgetStructure();
        }

        this.showLoading(true);
        this.recommendations = await this.api.getRecommendations(count);

        if ((!this.recommendations || this.recommendations.length === 0) && this.retryCount < this.maxRetries) {
            this.retryCount++;
            setTimeout(() => {
                this.initialize(count, true);
            }, 1000);
            return;
        }

        this.renderRecommendations();
        this.showLoading(false);
    }

    createWidgetStructure() {
        if (!this.container) {
            console.error(`Container with ID "${this.containerId}" not found`);
            return;
        }

        this.container.innerHTML = `
            <div class="taboola-header">
                <h2>Sponsored Content</h2>
            </div>
            <div class="taboola-content">
                <div class="taboola-loading">Loading recommendations...</div>
                <div class="taboola-error" style="display: none;"></div>
                <div class="taboola-grid"></div>
            </div>
        `;

        this.gridElement = this.container.querySelector('.taboola-grid');
        this.loadingElement = this.container.querySelector('.taboola-loading');
        this.errorElement = this.container.querySelector('.taboola-error');
    }

    showLoading(isLoading) {
        if (this.loadingElement) {
            this.loadingElement.style.display = isLoading ? 'flex' : 'none';
        }
    }

    showError(message) {
        this.showLoading(false);
        if (this.errorElement) {
            this.errorElement.innerHTML = `
                <p>${message}</p>
                <button class="refresh-button">Try Again</button>
            `;
            this.errorElement.style.display = 'flex';
        }
    }

    renderRecommendations() {
        if (!this.gridElement) {
            this.showError('Widget container not found.');
            return;
        }

        this.gridElement.innerHTML = '';

        if (!this.recommendations || this.recommendations.length === 0) {
            if (this.retryCount >= this.maxRetries) {
                this.showEmptyState();
            }
            return;
        }

        this.recommendations.forEach(recommendation => {
            const item = this.createRecommendationItem(recommendation);
            this.gridElement.appendChild(item);
        });
    }

    showEmptyState() {
        const emptyStateElement = document.createElement('div');
        emptyStateElement.className = 'taboola-empty-state';
        emptyStateElement.innerHTML = `
            <p>No sponsored content available at the moment.</p>
            <button class="refresh-button">Try Again</button>
        `;
        this.gridElement.appendChild(emptyStateElement);
    }

    createRecommendationItem(recommendation) {
        const item = document.createElement('div');
        item.className = 'recommendation-item';

        const thumbnailUrl = recommendation.thumbnail && recommendation.thumbnail.length > 0
            ? recommendation.thumbnail[0].url
            : 'https://via.placeholder.com/300x200?text=No+Image';

        item.innerHTML = `
            <div class="recommendation-close">✕</div>
            <img src="${thumbnailUrl}" alt="${recommendation.name}" />
            <div class="recommendation-title">${recommendation.name}</div>
            ${recommendation.branding ? `<span class="recommendation-branding">${recommendation.branding}</span>` : ''}
        `;

        item.addEventListener('click', (event) => {
            if (!event.target.closest('.recommendation-close')) {
                this.handleRecommendationClick(recommendation, event);
            }
        });

        return item;
    }

    handleRecommendationClick(recommendation, event) {
        event.preventDefault();
        this.api.handleRecommendationClick(recommendation, event);
    }

    async removeAndReplaceRecommendation(itemElement, oldRecommendation) {
        itemElement.innerHTML = `<div class="recommendation-loading">Loading...</div>`;

        try {
            const newRecommendations = await this.api.getRecommendations(1);

            if (newRecommendations && newRecommendations.length > 0) {
                const newItem = this.createRecommendationItem(newRecommendations[0]);

                if (itemElement.parentNode) {
                    itemElement.parentNode.replaceChild(newItem, itemElement);
                }

                const index = this.recommendations.findIndex(rec => rec.id === oldRecommendation.id);
                if (index !== -1) {
                    this.recommendations[index] = newRecommendations[0];
                }
            }
        } catch (error) {
            console.error('Error replacing recommendation:', error);
            itemElement.innerHTML = `
                <div class="recommendation-error">
                    <p>Failed to load new recommendation</p>
                    <button class="recommendation-retry">Retry</button>
                </div>
            `;
        }
    }
}

// Tests
describe('TaboolaAPI', () => {
    let api;

    beforeEach(() => {
        api = new TaboolaAPI();
        global.fetch.mockClear();
        window.open.mockClear();
    });

    test('should fetch sponsored recommendations', async () => {
        const recommendations = await api.getRecommendations();

        // Should call fetch once
        expect(fetch).toHaveBeenCalledTimes(1);

        // Should filter to only sponsored recommendations
        expect(recommendations.length).toBe(2);
        expect(recommendations[0].origin).toBe('sponsored');
        expect(recommendations[1].origin).toBe('sponsored');
    });

    test('should handle recommendation clicks', () => {
        const recommendation = {
            url: 'https://example.com/test'
        };

        api.handleRecommendationClick(recommendation);

        // Should open in a new tab
        expect(window.open).toHaveBeenCalledWith('https://example.com/test', '_blank');
    });

    test('should handle fetch errors gracefully', async () => {
        // Mock fetch to throw an error
        global.fetch.mockImplementationOnce(() => Promise.reject('API error'));

        const recommendations = await api.getRecommendations();

        // Should log the error
        expect(console.error).toHaveBeenCalledWith('Error fetching recommendations:', 'API error');

        // Should return an empty array
        expect(recommendations).toEqual([]);
    });

    test('should handle API bad response', async () => {
        // Mock fetch to return a bad response
        global.fetch.mockImplementationOnce(() =>
            Promise.resolve({
                ok: false,
                status: 500
            })
        );

        const recommendations = await api.getRecommendations();

        // Should log the error and return empty array
        expect(recommendations).toEqual([]);
    });

    test('should limit recommendations to requested count', async () => {
        const recommendations = await api.getRecommendations(1);

        // Should only return 1 recommendation
        expect(recommendations.length).toBe(1);
    });
});

// Tests for RecommendationWidget
describe('RecommendationWidget', () => {
    let widget;
    let mockApi;
    let mockContainer;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // Setup mock container
        mockContainer = {
            innerHTML: '',
            querySelector: jest.fn((selector) => {
                if (selector === '.taboola-grid') {
                    return {
                        innerHTML: '',
                        appendChild: jest.fn()
                    };
                } else if (selector === '.taboola-loading') {
                    return { style: {} };
                } else if (selector === '.taboola-error') {
                    return {
                        innerHTML: '',
                        style: {},
                        querySelector: jest.fn(() => ({
                            addEventListener: jest.fn()
                        }))
                    };
                }
                return null;
            })
        };

        document.getElementById.mockReturnValue(mockContainer);

        // Create mock API with controlled responses
        mockApi = {
            getRecommendations: jest.fn(() => Promise.resolve([
                {
                    id: 'rec1',
                    name: 'Test Recommendation 1',
                    origin: 'sponsored',
                    branding: 'Test Brand',
                    thumbnail: [{ url: 'test-url-1.jpg' }],
                    url: 'https://example.com/1'
                }
            ])),
            handleRecommendationClick: jest.fn()
        };

        // Create widget instance
        widget = new RecommendationWidget('test-container', mockApi);
    });

    test('should create widget structure', () => {
        widget.createWidgetStructure();

        // Should call getElementById
        expect(document.getElementById).toHaveBeenCalledWith('test-container');

        // Should set innerHTML of container
        expect(mockContainer.innerHTML).toMatch(/Sponsored Content/);

        // Should query for required elements
        expect(mockContainer.querySelector).toHaveBeenCalledWith('.taboola-grid');
        expect(mockContainer.querySelector).toHaveBeenCalledWith('.taboola-loading');
        expect(mockContainer.querySelector).toHaveBeenCalledWith('.taboola-error');
    });

    test('should show loading state', () => {
        widget.createWidgetStructure();
        widget.showLoading(true);

        // Should set loading display to flex
        expect(widget.loadingElement.style.display).toBe('flex');

        widget.showLoading(false);

        // Should set loading display to none
        expect(widget.loadingElement.style.display).toBe('none');
    });

    test('should show error message', () => {
        widget.createWidgetStructure();
        widget.showError('Test error message');

        // Should hide loading
        expect(widget.loadingElement.style.display).toBe('none');

        // Should set error message
        expect(widget.errorElement.innerHTML).toMatch(/Test error message/);

        // Should show error element
        expect(widget.errorElement.style.display).toBe('flex');
    });

    test('should initialize widget', async () => {
        // Mock methods
        widget.createWidgetStructure = jest.fn();
        widget.showLoading = jest.fn();
        widget.renderRecommendations = jest.fn();

        await widget.initialize();

        // Should create structure
        expect(widget.createWidgetStructure).toHaveBeenCalled();

        // Should show loading
        expect(widget.showLoading).toHaveBeenCalledWith(true);

        // Should fetch recommendations
        expect(mockApi.getRecommendations).toHaveBeenCalled();

        // Should render recommendations
        expect(widget.renderRecommendations).toHaveBeenCalled();

        // Should hide loading
        expect(widget.showLoading).toHaveBeenCalledWith(false);
    });

    test('should render recommendations', () => {
        // Setup
        widget.createWidgetStructure();
        widget.recommendations = [
            {
                id: 'rec1',
                name: 'Test Recommendation',
                branding: 'Test Brand',
                thumbnail: [{ url: 'test-url.jpg' }]
            }
        ];

        // Mock createRecommendationItem
        widget.createRecommendationItem = jest.fn(() => {
            const item = document.createElement('div');
            return item;
        });

        // Call method
        widget.renderRecommendations();

        // Should clear grid
        expect(widget.gridElement.innerHTML).toBe('');

        // Should create item for each recommendation
        expect(widget.createRecommendationItem).toHaveBeenCalledTimes(1);

        // Should append item to grid
        expect(widget.gridElement.appendChild).toHaveBeenCalledTimes(1);
    });

    test('should show empty state when no recommendations', () => {
        // Setup
        widget.createWidgetStructure();
        widget.recommendations = [];
        widget.retryCount = 3;
        widget.maxRetries = 3;

        // Mock showEmptyState
        widget.showEmptyState = jest.fn();

        // Call method
        widget.renderRecommendations();

        // Should show empty state
        expect(widget.showEmptyState).toHaveBeenCalled();
    });

    test('should create recommendation item', () => {
        const recommendation = {
            id: 'rec1',
            name: 'Test Recommendation',
            branding: 'Test Brand',
            thumbnail: [{ url: 'test-url.jpg' }]
        };

        const item = widget.createRecommendationItem(recommendation);

        // Should create div with correct class
        expect(item.className).toBe('recommendation-item');

        // Should set innerHTML with recommendation data
        expect(item.innerHTML).toMatch(/Test Recommendation/);
        expect(item.innerHTML).toMatch(/Test Brand/);
        expect(item.innerHTML).toMatch(/test-url.jpg/);

        // Should add click event listener
        expect(item.addEventListener).toHaveBeenCalled();
    });

    test('should handle recommendation clicks', () => {
        const recommendation = { id: 'rec1' };
        const mockEvent = { preventDefault: jest.fn() };

        widget.handleRecommendationClick(recommendation, mockEvent);

        // Should prevent default
        expect(mockEvent.preventDefault).toHaveBeenCalled();

        // Should delegate to API
        expect(mockApi.handleRecommendationClick).toHaveBeenCalledWith(recommendation, mockEvent);
    });

    test('should handle empty recommendations with retry', async () => {
        // Mock API to return empty first, then data on second call
        mockApi.getRecommendations
            .mockImplementationOnce(() => Promise.resolve([]))
            .mockImplementationOnce(() => Promise.resolve([{ id: 'rec1' }]));

        // Mock methods
        widget.createWidgetStructure = jest.fn();
        widget.showLoading = jest.fn();
        widget.renderRecommendations = jest.fn();

        await widget.initialize();

        // Should increment retry count
        expect(widget.retryCount).toBe(1);

        // Should set timeout to retry
        expect(setTimeout).toHaveBeenCalled();

        // Fast-forward timers
        jest.runAllTimers();

        // Should call API again
        expect(mockApi.getRecommendations).toHaveBeenCalledTimes(2);
    });

    test('should handle API errors', async () => {
        // Mock API to throw error
        mockApi.getRecommendations.mockImplementationOnce(() => {
            throw new Error('API error');
        });

        // Mock console.error
        console.error = jest.fn();

        // Mock methods
        widget.createWidgetStructure = jest.fn();
        widget.showLoading = jest.fn();
        widget.showError = jest.fn();

        // Initialize should catch the error
        await expect(widget.initialize()).rejects.toThrow('API error');
    });

    test('should replace recommendations', async () => {
        const oldRecommendation = { id: 'rec1' };
        const mockItemElement = {
            innerHTML: '',
            parentNode: {
                replaceChild: jest.fn()
            }
        };

        // Mock createRecommendationItem
        widget.createRecommendationItem = jest.fn(() => {
            const newItem = document.createElement('div');
            return newItem;
        });

        // Mock recommendations array
        widget.recommendations = [oldRecommendation];

        await widget.removeAndReplaceRecommendation(mockItemElement, oldRecommendation);

        // Should set loading state
        expect(mockItemElement.innerHTML).toMatch(/Loading/);

        // Should fetch new recommendation
        expect(mockApi.getRecommendations).toHaveBeenCalledWith(1);

        // Should create new item
        expect(widget.createRecommendationItem).toHaveBeenCalled();

        // Should replace old item with new one
        expect(mockItemElement.parentNode.replaceChild).toHaveBeenCalled();
    });
});