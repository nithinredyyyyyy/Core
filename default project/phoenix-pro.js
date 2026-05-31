/* ================================
   Phoenix Code Playground
   Interactive Onboarding Script
   ================================ */

// ==============================
// Display String Constants
// ==============================

const DISPLAY_STRINGS = {
    // Navigation buttons
    BUTTON_BACK: "Back",
    BUTTON_PREVIOUS: "Previous",
    BUTTON_NEXT: "Next",
    BUTTON_TIP: "Tip",
    BUTTON_FINISH: "Finish",
    BUTTON_ONE_MORE: "One more thing",
    BUTTON_START_AGAIN: "Start Again",

    // Section 4 progress toast
    CARD_COUNT_TEMPLATE: "{NUM_DONE}/3 cards",
    DELETE_COUNT_TEMPLATE: "{NUM_DONE}/1 deleted",

    // Console messages
    CONSOLE_TITLE: '🔥 Phoenix Code Playground 🔥',
    CONSOLE_WELCOME: 'Welcome to the interactive onboarding experience!'
};

// ==============================
// Page Type Mnemonics for Tracking (max 6 letters)
// ==============================

const PAGE_TYPES = {
    1: 'intro',           // Section 1: Video intro
    2: 'edtext',          // Section 2: Edit text
    3: 'image',           // Section 3: Replace image
    4: 'edcard',          // Section 4: Edit cards (duplicate/delete)
    5: 'drag',            // Section 5: Reorder elements
    6: 'links',           // Section 6: Edit links
    7: 'fin',             // Section 7: Completion. This code shouldn't be changed without updating fn demoPageVisited
    8: 'bonus'            // Section 8: Bonus (measurements)
};

// ==============================
// Platform Detection
// ==============================

function isMac() {
    return /Mac|iPhone|iPad|iPod/.test(navigator.platform) ||
           /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);
}

function getUndoShortcut() {
    return isMac() ? 'Cmd+Z' : 'Ctrl+Z';
}

function getRedoShortcut() {
    return isMac() ? 'Cmd+Y' : 'Ctrl+Y';
}

function getDuplicateShortcut() {
    return isMac() ? 'Cmd+D' : 'Ctrl+D';
}

// ==============================
// State Management
// ==============================

const state = {
    currentSection: 1,
    totalSections: 8,
    completedSections: new Set(),
    section1Completed: false,
    section3Completed: false,
    section4Completed: false,
    section5Completed: false,
    section6Completed: false,
    videoSlideVisible: false,
    editTextSectionNumber: 2,  // Will be 1 if video not available, 2 if video is available
    imageReplaceSectionNumber: 3,  // Section number for image replacement
    cardEditSectionNumber: 4,  // Section number for card editing
    reorderSectionNumber: 5,  // Section number for reordering
    linkEditSectionNumber: 6,  // Section number for link editing (final slide)
    imageWatcherCleanup: null,  // Cleanup function for image replacement watcher
    cardWatcherCleanup: null,  // Cleanup function for card editing watcher
    reorderWatcherCleanup: null,  // Cleanup function for reorder watcher
    linkWatcherCleanup: null,  // Cleanup function for link editing watcher
    toastTimeout: null  // Timeout for auto-hiding toast
};

// ==============================
// DOM Elements
// ==============================

const elements = {
    sections: document.querySelectorAll('.section'),
    progressDots: document.querySelectorAll('.progress-dot'),
    progressLines: document.querySelectorAll('.progress-line'),
    editableText: document.getElementById('editable-name'),
    successMessage: document.getElementById('success-message'),
    successMessageSection3: document.getElementById('success-message-section3'),
    successMessageTextSection3Url: document.getElementById('success-message-text-section3-url'),
    successMessageTextSection3Local: document.getElementById('success-message-text-section3-local'),
    successMessageSection4: document.getElementById('success-message-section4'),
    successMessageSection5: document.getElementById('success-message-section5'),
    successMessageSection6: document.getElementById('success-message-section6'),
    progressToastSection4: document.getElementById('progress-toast-section4'),
    undoMessageSection4: document.getElementById('undo-message-section4'),
    cardCountStatus: document.getElementById('card-count-status'),
    deleteCountStatus: document.getElementById('delete-count-status'),
    replaceableImage: document.getElementById('replaceable-image'),
    editableLink: document.getElementById('editable-link'),
    confettiContainer: document.getElementById('confetti-container'),
    getStartedButton: document.getElementById('get-started-button'),
    hintContents: document.querySelectorAll('.hint-content-inline')
};

// ==============================
// Slide Controls Rendering
// ==============================

function renderSlideControls(sectionNumber) {
    // Get the current section element
    const sectionElement = document.getElementById(`section-${sectionNumber}`);
    if (!sectionElement) {
        return;
    }

    // Find the slide-controls div within this section
    const slideControlsContainer = sectionElement.querySelector('.slide-controls');
    if (!slideControlsContainer) {
        return;
    }

    // Section 1 (intro video) doesn't need slide controls
    if (sectionNumber === 1 && state.videoSlideVisible) {
        slideControlsContainer.style.display = 'none';
        return;
    }

    slideControlsContainer.style.display = 'flex';

    let html = '';

    // Previous button (not shown on first section)
    if (sectionNumber > 1) {
        const prevLabel = sectionNumber === state.totalSections ? DISPLAY_STRINGS.BUTTON_BACK : DISPLAY_STRINGS.BUTTON_PREVIOUS;
        html += `
            <button class="slide-nav-button prev phcode-dismiss-lp-edit">
                <i class="fas fa-arrow-left"></i>
                <span>${prevLabel}</span>
            </button>
        `;
    } else {
        // Add spacer for layout consistency
        html += '<div style="flex: 1;"></div>';
    }

    // Hint button (for sections 2-6 and section 8 bonus, not on completion slide 7)
    if ((sectionNumber >= 2 && sectionNumber <= 6) || sectionNumber === 8) {
        html += `
            <button class="hint-button-inline" data-section="${sectionNumber}">
                <i class="fas fa-lightbulb"></i>
                <span>${DISPLAY_STRINGS.BUTTON_TIP}</span>
            </button>
        `;
    }

    // Next, Finish, One more, or Start Again button
    if (sectionNumber < 6) {
        // Regular next button for sections 2-5
        html += `
            <button class="slide-nav-button next phcode-dismiss-lp-edit">
                <span>${DISPLAY_STRINGS.BUTTON_NEXT}</span>
                <i class="fas fa-arrow-right"></i>
            </button>
        `;
    } else if (sectionNumber === 6) {
        // Section 6: Show "Finish" button to go to completion
        html += `
            <button class="slide-nav-button finish phcode-dismiss-lp-edit">
                <i class="fas fa-check"></i>
                <span>${DISPLAY_STRINGS.BUTTON_FINISH}</span>
                <i class="fas fa-arrow-right"></i>
            </button>
        `;
    } else if (sectionNumber === 7) {
        // Section 7 (Completion): Show "One more" and "Start Again"
        html += `
            <button class="slide-nav-button one-more phcode-dismiss-lp-edit">
                <i class="fas fa-star"></i>
                <span>${DISPLAY_STRINGS.BUTTON_ONE_MORE}</span>
            </button>
            <button class="slide-nav-button start-again phcode-dismiss-lp-edit">
                <i class="fas fa-redo"></i>
                <span>${DISPLAY_STRINGS.BUTTON_START_AGAIN}</span>
            </button>
        `;
    } else {
        // Section 8 (Bonus): Show "Start Again" button
        html += `
            <button class="slide-nav-button start-again phcode-dismiss-lp-edit">
                <i class="fas fa-redo"></i>
                <span>${DISPLAY_STRINGS.BUTTON_START_AGAIN}</span>
            </button>
        `;
    }

    slideControlsContainer.innerHTML = html;

    // Attach event listeners to newly created buttons
    attachSlideControlListeners(slideControlsContainer);
}

function attachSlideControlListeners(slideControlsContainer) {
    if (!slideControlsContainer) {
        return;
    }

    const prevButton = slideControlsContainer.querySelector('.prev');
    const nextButton = slideControlsContainer.querySelector('.next');
    const oneMoreButton = slideControlsContainer.querySelector('.one-more');
    const finishButton = slideControlsContainer.querySelector('.finish');
    const startAgainButton = slideControlsContainer.querySelector('.start-again');
    const hintButton = slideControlsContainer.querySelector('.hint-button-inline');

    if (prevButton) {
        prevButton.addEventListener('click', goToPreviousSection);
    }

    if (nextButton) {
        nextButton.addEventListener('click', goToNextSection);
    }

    if (oneMoreButton) {
        oneMoreButton.addEventListener('click', () => goToSection(8));
    }

    if (finishButton) {
        finishButton.addEventListener('click', () => goToSection(7));
    }

    if (startAgainButton) {
        startAgainButton.addEventListener('click', () => {
            if (typeof window.__ph_lp_tutorial_start_again === 'function') {
                window.__ph_lp_tutorial_start_again();
            }
            goToSection(1);
        });
    }

    if (hintButton) {
        hintButton.addEventListener('click', () => {
            const section = hintButton.getAttribute('data-section');
            const hintContent = document.querySelector(`.hint-content-inline[data-section="${section}"]`);
            if (hintContent) {
                hintContent.classList.toggle('visible');
            }
        });
    }
}

// ==============================
// Video Availability Check
// ==============================

async function checkVideoAvailability() {
    const section1 = document.getElementById('section-1');

    if (!section1) {
        return false;
    }

    // Always show section 1 with placeholder
    section1.style.display = 'block';
    section1.classList.add('active');
    state.videoSlideVisible = true;
    state.currentSection = 1;

    return true;
}

// ==============================
// Initialization
// ==============================

function initPlatformShortcuts() {
    // Set platform-specific keyboard shortcuts in the success messages
    const undoShortcutElement = document.getElementById('undo-shortcut');
    const redoShortcutElement = document.getElementById('redo-shortcut');
    const duplicateShortcutElement = document.getElementById('duplicate-shortcut');
    const undoShortcutSection4Element = document.getElementById('undo-shortcut-section4');
    const undoShortcutHintElement = document.getElementById('undo-shortcut-hint');
    const redoShortcutHintElement = document.getElementById('redo-shortcut-hint');

    if (undoShortcutElement) {
        undoShortcutElement.textContent = getUndoShortcut();
    }
    if (redoShortcutElement) {
        redoShortcutElement.textContent = getRedoShortcut();
    }
    if (duplicateShortcutElement) {
        duplicateShortcutElement.textContent = getDuplicateShortcut();
    }
    if (undoShortcutSection4Element) {
        undoShortcutSection4Element.textContent = getUndoShortcut();
    }
    if (undoShortcutHintElement) {
        undoShortcutHintElement.textContent = getUndoShortcut();
    }
    if (redoShortcutHintElement) {
        redoShortcutHintElement.textContent = getRedoShortcut();
    }
}

async function init() {
    await checkVideoAvailability();
    initPlatformShortcuts();
    setupEventListeners();
    updateUI();
}

// ==============================
// Event Listeners
// ==============================

function setupEventListeners() {
    // Get started button
    if (elements.getStartedButton) {
        elements.getStartedButton.addEventListener('click', () => {
            // Mark section 1 (video intro) as completed
            if (state.videoSlideVisible) {
                state.completedSections.add(1);
                // Track section 1 completion
                if (typeof window.__ph_lp_demo_page_visit === 'function') {
                    window.__ph_lp_demo_page_visit(PAGE_TYPES[1], 1, true);
                }
            }
            goToNextSection();
        });
    }

    // Monitor editable elements in playground
    setupPlaygroundValidation();

    // Note: Image replacement monitoring is started/stopped in goToSection()
    // when entering/leaving section 3

    // Progress dots (click navigation)
    elements.progressDots.forEach((dot) => {
        dot.addEventListener('click', () => {
            const targetSection = parseInt(dot.getAttribute('data-section'));
            // Allow navigation to any section
            goToSection(targetSection);
        });
    });
}

// ==============================
// Section Navigation
// ==============================

function goToNextSection() {
    if (state.currentSection < state.totalSections) {
        goToSection(state.currentSection + 1);
    }
}

function goToPreviousSection() {
    if (state.currentSection > 1) {
        goToSection(state.currentSection - 1);
    }
}

function goToSection(sectionNumber) {
    if (sectionNumber < 1 || sectionNumber > state.totalSections) { return; }

    // Stop image watcher if leaving section 3
    if (state.currentSection === state.imageReplaceSectionNumber && state.imageWatcherCleanup) {
        state.imageWatcherCleanup();
        state.imageWatcherCleanup = null;
    }

    // Stop card watcher if leaving section 4
    if (state.currentSection === state.cardEditSectionNumber && state.cardWatcherCleanup) {
        state.cardWatcherCleanup();
        state.cardWatcherCleanup = null;
        // Hide toast, undo message, and clear timeout when leaving section 4
        hideProgressToast();
        hideUndoMessage();
    }

    // Stop reorder watcher if leaving section 5
    if (state.currentSection === state.reorderSectionNumber && state.reorderWatcherCleanup) {
        state.reorderWatcherCleanup();
        state.reorderWatcherCleanup = null;
    }

    // Stop link watcher if leaving section 6
    if (state.currentSection === state.linkEditSectionNumber && state.linkWatcherCleanup) {
        state.linkWatcherCleanup();
        state.linkWatcherCleanup = null;
    }

    // Hide arrow pointers when leaving section 6
    if (state.currentSection === state.linkEditSectionNumber) {
        hideArrowPointers();
    }

    // Hide current section
    const currentSection = document.querySelector('.section.active');
    if (currentSection) {
        currentSection.classList.remove('active');
        // Remove inline display style if present (for video section)
        currentSection.style.display = '';
    }

    // Show new section instantly
    const newSection = document.getElementById(`section-${sectionNumber}`);
    if (newSection) {
        newSection.classList.add('active');
        // Remove inline display style if present (for video section)
        newSection.style.display = '';
        state.currentSection = sectionNumber;

        // Render slide controls for the new section
        renderSlideControls(sectionNumber);

        updateUI();

        // Restore highlight for completed sections
        if ((sectionNumber === state.editTextSectionNumber && state.section1Completed) ||
            (sectionNumber === state.imageReplaceSectionNumber && state.section3Completed) ||
            (sectionNumber === state.cardEditSectionNumber && state.section4Completed) ||
            (sectionNumber === state.reorderSectionNumber && state.section5Completed) ||
            (sectionNumber === state.linkEditSectionNumber && state.section6Completed)) {
            highlightNextButtons();
        } else {
            removeHighlightFromNextButtons();
        }

        // Start image watcher if entering section 3
        if (sectionNumber === 3 && !state.imageWatcherCleanup) {
            state.imageWatcherCleanup = setupImageReplaceValidation();
        }

        // Start card watcher if entering section 4
        if (sectionNumber === 4 && !state.cardWatcherCleanup) {
            state.cardWatcherCleanup = setupCardEditValidation();

            // Auto-click the card text inside the first demo card when landing on section 4
            setTimeout(() => {
                const firstCardText = document.querySelector('#section-4 .demo-card .card-text');
                if (firstCardText) {
                    firstCardText.click();
                }
            }, 150);
        }

        // Start reorder watcher if entering section 5
        if (sectionNumber === 5 && !state.reorderWatcherCleanup) {
            state.reorderWatcherCleanup = setupReorderValidation();
        }

        // Start link watcher if entering section 6
        if (sectionNumber === 6 && !state.linkWatcherCleanup) {
            state.linkWatcherCleanup = setupLinkEditValidation();

            // Auto-click the editable link to show the toolbar
            setTimeout(() => {
                const editableLink = document.getElementById('editable-link');
                if (editableLink) {
                    editableLink.click();
                }
            }, 150);
        }

        // Celebrate when reaching completion slide (section 7)
        if (sectionNumber === 7) {
            triggerConfetti();
        }

        // Section 8: Bonus Measurements - auto-click first box and auto-open tips
        if (sectionNumber === 8) {
            setTimeout(() => {
                const alignBox1 = document.getElementById('align-box-1');
                if (alignBox1) {
                    alignBox1.click();
                }
            }, 150);
            // Auto-show the tips
            const hintSection8 = document.querySelector('.hint-content-inline[data-section="8"]');
            if (hintSection8) {
                hintSection8.classList.add('visible');
            }
        }

        // Restore success messages for completed sections
        if (sectionNumber === state.editTextSectionNumber && state.section1Completed) {
            elements.successMessage?.classList.add('show');
        }
        if (sectionNumber === state.imageReplaceSectionNumber && state.section3Completed) {
            elements.successMessageSection3?.classList.add('show');
        }
        if (sectionNumber === state.cardEditSectionNumber && state.section4Completed) {
            elements.successMessageSection4?.classList.add('show');
        }
        if (sectionNumber === state.reorderSectionNumber && state.section5Completed) {
            elements.successMessageSection5?.classList.add('show');
        }
        if (sectionNumber === state.linkEditSectionNumber && state.section6Completed) {
            elements.successMessageSection6?.classList.add('show');
        }

        scrollToTop();

        // Track page visit
        if (typeof window.__ph_lp_demo_page_visit === 'function') {
            const pageType = PAGE_TYPES[sectionNumber] || 'unknown';
            window.__ph_lp_demo_page_visit(pageType, sectionNumber, false);
        }
    }
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'instant' });
}

// ==============================
// UI Updates
// ==============================

function updateUI() {
    updateProgressIndicator();
    updateNavigationButtons();
}

function updateProgressIndicator() {
    const progressContainer = document.querySelector('.progress-container');

    // Make progress dots non-interactive on section 1 (video intro)
    if (state.currentSection === 1) {
        if (progressContainer) {
            progressContainer.style.pointerEvents = 'none';
            progressContainer.style.opacity = '0.7';
        }
    } else {
        if (progressContainer) {
            progressContainer.style.pointerEvents = 'auto';
            progressContainer.style.opacity = '1';
        }
    }

    elements.progressDots.forEach((dot) => {
        const sectionNumber = parseInt(dot.getAttribute('data-section'));

        dot.classList.remove('active', 'completed', 'next-up');

        if (state.completedSections.has(sectionNumber)) {
            dot.classList.add('completed');
        } else if (sectionNumber === state.currentSection) {
            dot.classList.add('active');
        }
    });

    // On section 1 (intro), highlight the first tutorial step as "next up"
    if (state.currentSection === 1) {
        const firstDot = document.querySelector('.progress-dot[data-section="2"]');
        if (firstDot) {
            firstDot.classList.add('next-up');
        }
    }

    // Update progress lines
    elements.progressLines.forEach((line, index) => {
        // Lines connect dots for sections 2, 3, 4 (between 2-3, 3-4, 4-5)
        const sectionNumber = index + 2;
        line.classList.toggle('completed', state.completedSections.has(sectionNumber));
    });
}

function updateNavigationButtons() {
    // Get the current section's slide controls
    const sectionElement = document.getElementById(`section-${state.currentSection}`);
    if (!sectionElement) {
        return;
    }

    const slideControlsContainer = sectionElement.querySelector('.slide-controls');
    if (!slideControlsContainer) {
        return;
    }

    const prevButton = slideControlsContainer.querySelector('.prev');
    const nextButton = slideControlsContainer.querySelector('.next');

    if (prevButton) {
        prevButton.disabled = state.currentSection === 1;
    }

    if (nextButton) {
        nextButton.disabled = state.currentSection === state.totalSections;
    }
    // start-again button is never disabled
}

// ==============================
// Common Completion Handler
// ==============================

function handleSectionCompletion(sectionNumber, successMessageElement, hintSectionNumber = null) {
    // Open the tip if not already open
    const hintSection = hintSectionNumber || sectionNumber;
    const hintContent = document.querySelector(`.hint-content-inline[data-section="${hintSection}"]`);
    if (hintContent && !hintContent.classList.contains('visible')) {
        hintContent.classList.add('visible');
    }

    // Celebrate with confetti
    triggerConfetti();

    // Highlight Next buttons
    highlightNextButtons();

    // Update UI
    updateUI();

    // Track section completion
    if (typeof window.__ph_lp_demo_page_visit === 'function') {
        const pageType = PAGE_TYPES[sectionNumber] || 'unknown';
        window.__ph_lp_demo_page_visit(pageType, sectionNumber, true);
    }

    // Auto-scroll to success message
    if (successMessageElement) {
        setTimeout(() => {
            successMessageElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
    }
}

// ==============================
// Section 2: Monitor Live Preview Edits
// ==============================

function setupPlaygroundValidation() {
    // Find all playground sections
    const playgrounds = document.querySelectorAll('.playground');

    playgrounds.forEach(playground => {
        // Find all editable elements within this playground
        const editableElements = playground.querySelectorAll('[contenteditable="true"], .editable-text');

        editableElements.forEach(element => {
            // Validate on blur (when user clicks outside)
            element.addEventListener('blur', () => {
                validatePlaygroundEdit(element);
            });

            // Validate on Enter key press
            element.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    element.blur(); // This will trigger the blur event and validate
                }
            });
        });
    });
}

function validatePlaygroundEdit(element) {
    const text = element.textContent.trim();
    const isValid = validateEdit(text);

    // Update visual feedback
    if (isValid) {
        element.style.color = 'var(--success-green)';
        if (!state.section1Completed) {
            markSection1Complete();
        }
    } else {
        element.style.color = 'var(--text-primary)';
        // Hide success message if edit is undone
        if (state.section1Completed) {
            state.section1Completed = false;
            state.completedSections.delete(state.editTextSectionNumber);
            elements.successMessage.classList.remove('show');
            removeHighlightFromNextButtons();
            updateUI();
        }
    }
}

function validateEdit(text) {
    // Validation criteria:
    // 1. Text must not be empty
    // 2. Must not contain "___"
    // 3. Must not be the default "Hello ___"
    // 4. Must be different from just "Hello"

    if (!text || text.length === 0) {
        return false;
    }
    if (text.includes('___')) { return false; }
    if (text === 'Hello ___') { return false; }
    if (text === 'Hello') { return false; }

    return true;
}

function markSection1Complete() {
    state.section1Completed = true;
    state.completedSections.add(state.editTextSectionNumber);

    // Show success message
    elements.successMessage.classList.add('show');

    // Handle completion
    handleSectionCompletion(state.editTextSectionNumber, elements.successMessage);
}

// ==============================
// Section 3: Monitor Image Replacement
// ==============================

// Store initial image src at page load
let initialImageSrc = null;

function setupImageReplaceValidation() {
    const imageElement = document.getElementById('replaceable-image');
    if (!imageElement) { return null; }

    if (!initialImageSrc) {
        initialImageSrc = imageElement.src;
    }

    let wasPreviewingBefore = false;
    let sawDifferentImageDuringPreview = false;
    let lastCheckedSrc = initialImageSrc;

    const pollInterval = setInterval(() => {
        // Get fresh reference each time since Phoenix replaces the node
        const img = document.getElementById('replaceable-image');
        if (!img) { return; }

        const currentSrc = img.src;
        const isPreviewing = img._isPhoenixImagePreviewing === true;

        // Track if we see a different image during preview
        if (isPreviewing && currentSrc !== initialImageSrc) {
            sawDifferentImageDuringPreview = true;
        }

        // Detect preview ending after seeing a different image
        if (wasPreviewingBefore && !isPreviewing && sawDifferentImageDuringPreview) {
            // Only trigger success if the image actually changed (was committed)
            if (currentSrc !== initialImageSrc) {
                handleImageReplaceSuccess(currentSrc);
            }
            // Reset the flag regardless
            sawDifferentImageDuringPreview = false;
        }

        // Also detect direct image changes (when clicked without preview detection)
        if (!isPreviewing && !wasPreviewingBefore && currentSrc !== lastCheckedSrc && currentSrc !== initialImageSrc) {
            handleImageReplaceSuccess(currentSrc);
        }

        wasPreviewingBefore = isPreviewing;
        lastCheckedSrc = currentSrc;
    }, 400);

    return () => {
        clearInterval(pollInterval);
    };
}

function handleImageReplaceSuccess(newSrc) {
    if (state.section3Completed) { return; } // Only trigger once

    state.section3Completed = true;
    state.completedSections.add(state.imageReplaceSectionNumber);

    // Show the appropriate success message based on the src
    if (newSrc.startsWith('https://') || newSrc.startsWith('http://')) {
        if (elements.successMessageTextSection3Url) {
            elements.successMessageTextSection3Url.style.display = 'block';
        }
        if (elements.successMessageTextSection3Local) {
            elements.successMessageTextSection3Local.style.display = 'none';
        }
    } else {
        if (elements.successMessageTextSection3Url) {
            elements.successMessageTextSection3Url.style.display = 'none';
        }
        if (elements.successMessageTextSection3Local) {
            elements.successMessageTextSection3Local.style.display = 'block';
        }
    }

    // Show success message container
    if (elements.successMessageSection3) {
        elements.successMessageSection3.classList.add('show');
    }

    // Handle completion
    handleSectionCompletion(state.imageReplaceSectionNumber, elements.successMessageSection3);
}

// ==============================
// Section 4: Monitor Card Editing
// ==============================

function setupCardEditValidation() {
    const cardsContainer = document.querySelector('#section-4 .cards-container');
    if (!cardsContainer) { return null; }

    let previousCardCount = cardsContainer.querySelectorAll('.demo-card').length;
    let reachedThreeCards = previousCardCount >= 3;
    let deletedCard = false;
    let deleteCount = 0;

    const pollInterval = setInterval(() => {
        // Get fresh reference each time
        const container = document.querySelector('#section-4 .cards-container');
        if (!container) { return; }

        const currentCardCount = container.querySelectorAll('.demo-card').length;

        // Check if all cards deleted - show undo message
        if (currentCardCount === 0) {
            hideProgressToast();
            showUndoMessage();
            // Reset completion state if user deletes all cards
            if (state.section4Completed) {
                state.section4Completed = false;
                state.completedSections.delete(state.cardEditSectionNumber);
                if (elements.successMessageSection4) {
                    elements.successMessageSection4.classList.remove('show');
                }
                removeHighlightFromNextButtons();
                updateUI();
            }
        } else {
            hideUndoMessage();

            // Check if we reached 3 cards
            if (currentCardCount >= 3) {
                reachedThreeCards = true;
            }

            // Check if a card was deleted (count decreased)
            if (currentCardCount < previousCardCount) {
                deletedCard = true;
                deleteCount = 1;
            }

            // Update and show toast if count changed
            if (currentCardCount !== previousCardCount) {
                updateProgressToast(currentCardCount, deleteCount);
                showProgressToast();
            }

            // Success condition: reached 3 cards AND deleted a card
            if (reachedThreeCards && deletedCard && !state.section4Completed) {
                handleCardEditSuccess();
            }
        }

        previousCardCount = currentCardCount;
    }, 400);

    return () => {
        clearInterval(pollInterval);
    };
}

function updateProgressToast(cardCount, deleteCount) {
    if (elements.cardCountStatus) {
        elements.cardCountStatus.textContent = DISPLAY_STRINGS.CARD_COUNT_TEMPLATE.replace('{NUM_DONE}', cardCount);

        // Highlight in yellow if reached 3
        if (cardCount >= 3) {
            elements.cardCountStatus.style.color = '#FFD700';
            elements.cardCountStatus.style.fontWeight = '700';
        } else {
            elements.cardCountStatus.style.color = '#FFFFFF';
            elements.cardCountStatus.style.fontWeight = '600';
        }
    }

    if (elements.deleteCountStatus) {
        elements.deleteCountStatus.textContent = DISPLAY_STRINGS.DELETE_COUNT_TEMPLATE.replace('{NUM_DONE}', deleteCount);

        // Highlight in yellow if deleted
        if (deleteCount >= 1) {
            elements.deleteCountStatus.style.color = '#FFD700';
            elements.deleteCountStatus.style.fontWeight = '700';
        } else {
            elements.deleteCountStatus.style.color = '#FFFFFF';
            elements.deleteCountStatus.style.fontWeight = '600';
        }
    }
}

function showProgressToast() {
    if (!elements.progressToastSection4) { return; }

    // Clear existing timeout if any
    if (state.toastTimeout) {
        clearTimeout(state.toastTimeout);
    }

    // Remove hiding class if it exists and show the toast
    elements.progressToastSection4.classList.remove('hiding');
    elements.progressToastSection4.classList.add('show');

    // Auto-hide after 2 seconds
    state.toastTimeout = setTimeout(() => {
        hideProgressToast();
    }, 2000);
}

function hideProgressToast() {
    if (!elements.progressToastSection4) { return; }

    // Add hiding class for fade-out animation
    elements.progressToastSection4.classList.add('hiding');

    // Remove both classes after animation completes
    setTimeout(() => {
        if (elements.progressToastSection4) {
            elements.progressToastSection4.classList.remove('show', 'hiding');
        }
    }, 300);

    // Clear the timeout if it exists
    if (state.toastTimeout) {
        clearTimeout(state.toastTimeout);
        state.toastTimeout = null;
    }
}

function showUndoMessage() {
    if (!elements.undoMessageSection4) { return; }

    elements.undoMessageSection4.classList.remove('hiding');
    elements.undoMessageSection4.classList.add('show');
}

function hideUndoMessage() {
    if (!elements.undoMessageSection4) { return; }

    elements.undoMessageSection4.classList.add('hiding');

    setTimeout(() => {
        if (elements.undoMessageSection4) {
            elements.undoMessageSection4.classList.remove('show', 'hiding');
        }
    }, 300);
}

function handleCardEditSuccess() {
    if (state.section4Completed) { return; } // Only trigger once

    state.section4Completed = true;
    state.completedSections.add(state.cardEditSectionNumber);

    // Hide the progress toast
    hideProgressToast();

    // Show success message
    if (elements.successMessageSection4) {
        elements.successMessageSection4.classList.add('show');
    }

    // Handle completion
    handleSectionCompletion(state.cardEditSectionNumber, elements.successMessageSection4);
}

function highlightNextButtons() {
    // Get the current section's slide controls
    const sectionElement = document.getElementById(`section-${state.currentSection}`);
    if (!sectionElement) { return; }

    const slideControlsContainer = sectionElement.querySelector('.slide-controls');
    if (!slideControlsContainer) { return; }

    const nextButton = slideControlsContainer.querySelector('.slide-nav-button.next');
    if (nextButton) {
        nextButton.classList.add('highlighted');
    }
}

function removeHighlightFromNextButtons() {
    // Get the current section's slide controls
    const sectionElement = document.getElementById(`section-${state.currentSection}`);
    if (!sectionElement) { return; }

    const slideControlsContainer = sectionElement.querySelector('.slide-controls');
    if (!slideControlsContainer) { return; }

    const nextButton = slideControlsContainer.querySelector('.slide-nav-button.next');
    if (nextButton) {
        nextButton.classList.remove('highlighted');
    }
}

// ==============================
// Section 5: Monitor Reordering
// ==============================

function setupReorderValidation() {
    const notesContainer = document.querySelector('#section-5 .notes-container');
    if (!notesContainer) { return null; }

    // Assign unique IDs to notes at initialization
    const initialNotes = Array.from(notesContainer.querySelectorAll('.sticky-note'));
    initialNotes.forEach((note, index) => {
        note.dataset.noteId = `note-${index}`;
    });

    // Capture initial order
    const initialOrder = initialNotes.map(note => note.dataset.noteId);

    const pollInterval = setInterval(() => {
        // Get fresh reference each time
        const container = document.querySelector('#section-5 .notes-container');
        if (!container) { return; }

        const currentNotes = Array.from(container.querySelectorAll('.sticky-note'));
        const currentOrder = currentNotes.map(note => note.dataset.noteId);

        // Check if order changed (compare arrays)
        const orderChanged = initialOrder.some((id, index) => currentOrder[index] !== id);

        if (orderChanged && !state.section5Completed) {
            handleReorderSuccess();
        }
    }, 400);

    return () => {
        clearInterval(pollInterval);
    };
}

function handleReorderSuccess() {
    if (state.section5Completed) { return; } // Only trigger once

    state.section5Completed = true;
    state.completedSections.add(state.reorderSectionNumber);

    // Show success message
    if (elements.successMessageSection5) {
        elements.successMessageSection5.classList.add('show');
    }

    // Handle completion
    handleSectionCompletion(state.reorderSectionNumber, elements.successMessageSection5);
}

// ==============================
// Section 6: Monitor Link Editing
// ==============================

// Store initial link href at page load
let initialLinkHref = null;

function setupLinkEditValidation() {
    const linkElement = document.getElementById('editable-link');
    if (!linkElement) { return null; }

    if (!initialLinkHref) {
        initialLinkHref = linkElement.href;
    }

    const pollInterval = setInterval(() => {
        // Get fresh reference each time since Phoenix may replace the node
        const link = document.getElementById('editable-link');
        if (!link) { return; }

        const currentHref = link.href;

        // Detect if link href changed
        if (currentHref !== initialLinkHref && !state.section6Completed) {
            handleLinkEditSuccess();
        }
    }, 400);

    return () => {
        clearInterval(pollInterval);
    };
}

function handleLinkEditSuccess() {
    if (state.section6Completed) { return; } // Only trigger once

    state.section6Completed = true;
    state.completedSections.add(state.linkEditSectionNumber);

    // Show success message
    if (elements.successMessageSection6) {
        elements.successMessageSection6.classList.add('show');
    }

    // Handle completion
    handleSectionCompletion(state.linkEditSectionNumber, elements.successMessageSection6);
}

// ==============================
// Confetti Animation
// ==============================

function triggerConfetti() {
    const colors = [
        'var(--phoenix-orange)',
        'var(--phoenix-gold)',
        'var(--phoenix-yellow)',
        'var(--success-green)',
        '#4A90E2'
    ];

    const confettiCount = 50;

    for (let i = 0; i < confettiCount; i++) {
        createConfetti(colors);
    }
}

function createConfetti(colors) {
    const confetti = document.createElement('div');
    confetti.classList.add('confetti');

    // Random properties
    const color = colors[Math.floor(Math.random() * colors.length)];
    const left = Math.random() * 100;
    const animationDuration = 2 + Math.random() * 2;
    const delay = Math.random() * 0.5;
    const size = 8 + Math.random() * 6;

    confetti.style.left = `${left}%`;
    confetti.style.width = `${size}px`;
    confetti.style.height = `${size}px`;
    confetti.style.background = color;
    confetti.style.animationDuration = `${animationDuration}s`;
    confetti.style.animationDelay = `${delay}s`;

    // Random shapes
    const shapes = ['circle', 'square'];
    const shape = shapes[Math.floor(Math.random() * shapes.length)];
    if (shape === 'circle') {
        confetti.style.borderRadius = '50%';
    }

    elements.confettiContainer.appendChild(confetti);

    // Remove confetti after animation
    setTimeout(() => {
        confetti.remove();
    }, (animationDuration + delay) * 1000);
}

// ==============================
// Additional Features
// ==============================

// Add smooth hover effect to progress dots
elements.progressDots.forEach(dot => {
    dot.addEventListener('mouseenter', function() {
        if (!this.classList.contains('active')) {
            this.style.transform = 'scale(1.05)';
        }
    });

    dot.addEventListener('mouseleave', function() {
        if (!this.classList.contains('active')) {
            this.style.transform = 'scale(1)';
        }
    });
});

// ==============================
// Section 6: Arrow Pointer Hover
// ==============================

function setupArrowPointerHover() {
    const modeCards = document.getElementById('mode-cards-hover');
    const arrowLeft = document.getElementById('arrow-left');
    const arrowCenter = document.getElementById('arrow-center');

    if (!modeCards || !arrowLeft || !arrowCenter) { return; }

    modeCards.addEventListener('mouseenter', () => {
        // Only show arrows if we're on section 6
        if (state.currentSection === 6) {
            arrowLeft.classList.add('visible');
            arrowCenter.classList.add('visible');
        }
    });

    modeCards.addEventListener('mouseleave', () => {
        arrowLeft.classList.remove('visible');
        arrowCenter.classList.remove('visible');
    });
}

function hideArrowPointers() {
    const arrowLeft = document.getElementById('arrow-left');
    const arrowCenter = document.getElementById('arrow-center');
    if (arrowLeft) { arrowLeft.classList.remove('visible'); }
    if (arrowCenter) { arrowCenter.classList.remove('visible'); }
}

// ==============================
// Launch Application
// ==============================

document.addEventListener('DOMContentLoaded', () => {
    init();
    setupArrowPointerHover();
});

// ==============================
// Console Easter Egg
// ==============================

console.log(`%c${DISPLAY_STRINGS.CONSOLE_TITLE}`, 'font-size: 24px; font-weight: bold; color: #FF6B35;');
console.log(`%c${DISPLAY_STRINGS.CONSOLE_WELCOME}`, 'font-size: 14px; color: #5C5346;');
