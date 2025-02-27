/**
 * Mobile-specific functionality for the Recommendation Widget
 * This file extends the RecommendationWidget class with mobile features
 */

// Extend RecommendationWidget prototype with mobile methods
(function extendRecommendationWidget() {
    /**
     * Initialize mobile-specific features
     */
    RecommendationWidget.prototype.initMobileFeatures = function () {
        if (this.isMobileView) {
            // Setup the toggle arrow button
            this.setupToggleButton();

            // Setup scroll behavior for showing/hiding
            this.setupScrollBehavior();

            // Create mini-tab if it doesn't exist yet
            this.setupMiniTab();
        }
    };

    /**
     * Setup the toggle button with arrow icon
     */
    RecommendationWidget.prototype.setupToggleButton = function () {
        // Create the toggle button with arrow
        const headerElement = this.container.querySelector('.taboola-header');
        if (headerElement) {
            const toggleButton = document.createElement('button');
            toggleButton.className = 'taboola-toggle';
            toggleButton.setAttribute('aria-label', 'Toggle recommendations');

            // Create the arrow icon
            const arrowIcon = document.createElement('span');
            arrowIcon.className = 'toggle-arrow down';

            toggleButton.appendChild(arrowIcon);

            // Add the toggle button to the header
            headerElement.appendChild(toggleButton);

            // Add click event listener
            toggleButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

                // Toggle the hidden class on the container
                this.container.classList.add('hidden');

                this.showMiniTab(true);
            });
        }
    };

    /**
     * Setup mini-tab that appears when widget is hidden
     */
    RecommendationWidget.prototype.setupMiniTab = function () {
        // Remove existing mini-tab if any
        const existingMiniTab = document.querySelector('.taboola-mini-tab');
        if (existingMiniTab) {
            existingMiniTab.parentNode.removeChild(existingMiniTab);
        }

        // Create new mini-tab
        const miniTab = document.createElement('div');
        miniTab.className = 'taboola-mini-tab';
        miniTab.innerHTML = `
            <span>Recommendations</span> <span class="toggle-arrow up"></span>
        `;

        // Add to body
        document.body.appendChild(miniTab);

        // Add click event
        miniTab.addEventListener('click', () => {
            // Show the recommendations widget
            this.container.classList.remove('hidden');

            // Hide the mini-tab
            this.showMiniTab(false);
        });

        // Store reference
        this.miniTab = miniTab;
    };

    /**
     * Show or hide the mini-tab
     * @param {boolean} show - Whether to show or hide
     */
    RecommendationWidget.prototype.showMiniTab = function (show) {
        if (this.miniTab) {
            // When showing, add a slight delay to ensure smooth transition
            if (show) {
                // Small delay to ensure animations don't conflict
                setTimeout(() => {
                    this.miniTab.style.display = 'flex';
                }, 300);
            } else {
                this.miniTab.style.display = 'none';
            }
        }
    };

    /**
     * Setup scroll behavior for mobile view
     */
    RecommendationWidget.prototype.setupScrollBehavior = function () {
        // Clean up any existing scroll handlers to prevent duplicates
        this.removeScrollHandlers();

        let lastScrollTop = 0;
        const scrollThreshold = 20;

        // Handler for showing/hiding based on scroll direction
        const scrollHandler = () => {
            // Only apply in mobile view
            if (!this.isMobileView) return;

            const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;

            if (Math.abs(lastScrollTop - currentScrollTop) > scrollThreshold) {
                // Scrolling down - hide the bar
                if (currentScrollTop > lastScrollTop && currentScrollTop > 100) {
                    if (!this.container.classList.contains('hidden')) {
                        this.container.classList.add('hidden');
                        this.showMiniTab(true);
                    }
                }
                // Scrolling up - show the bar
                else if (currentScrollTop < lastScrollTop) {
                    // Only show if user has scrolled up significantly
                    if (lastScrollTop - currentScrollTop > 30) {
                        this.container.classList.remove('hidden');
                        this.showMiniTab(false);

                        // Ensure loading state is hidden when showing the bar after scrolling
                        if (this.loadingElement) {
                            this.showLoading(false);
                        }
                    }
                }

                lastScrollTop = currentScrollTop;
            }
        };

        // Handler for showing when reaching the bottom of the page
        const scrollEndHandler = () => {
            // Only apply in mobile view
            if (!this.isMobileView) return;

            if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 100) {
                this.container.classList.remove('hidden');
                this.showMiniTab(false);

                // Ensure loading state is hidden when showing the bar
                if (this.loadingElement) {
                    this.showLoading(false);
                }
            }
        };

        // Add the handlers and track them for later removal
        window.addEventListener('scroll', scrollHandler);
        window.addEventListener('scroll', scrollEndHandler);

        this.scrollHandlers.push({
            handler: scrollHandler,
            name: 'direction'
        });

        this.scrollHandlers.push({
            handler: scrollEndHandler,
            name: 'endOfPage'
        });
    };

    /**
     * Remove scroll handlers to prevent duplicates
     */
    RecommendationWidget.prototype.removeScrollHandlers = function () {
        this.scrollHandlers.forEach(handlerObj => {
            window.removeEventListener('scroll', handlerObj.handler);
        });

        this.scrollHandlers = [];
    };

    /**
     * Add resize listener to handle responsive changes
     */
    RecommendationWidget.prototype.addMobileResizeListener = function () {
        // Clean up existing listener if any
        if (this.resizeHandler) {
            window.removeEventListener('resize', this.resizeHandler);
        }

        this.resizeHandler = () => {
            const wasMobileView = this.isMobileView;
            this.isMobileView = window.innerWidth <= 750;

            // If we've crossed the mobile threshold, reinitialize the widget
            if (wasMobileView !== this.isMobileView) {
                // Remove scroll handlers if we're leaving mobile view
                if (!this.isMobileView) {
                    this.removeScrollHandlers();
                    // Hide mini-tab if we're switching to desktop
                    if (this.miniTab) {
                        this.showMiniTab(false);
                    }
                }
                this.createWidgetStructure();
                this.renderRecommendations();
                this.initializeMobileFeatures();
            }
        };

        window.addEventListener('resize', this.resizeHandler);
    };
})();