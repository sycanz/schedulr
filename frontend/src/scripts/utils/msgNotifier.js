/**
 * Shows an error notification to the user
 * @param {string} message - The error message to display
 * @param {string} title - Optional title for the notification (defaults to "Schedulr Error")
 * @param {boolean} isPopup - Whether this is called from popup context (defaults to false)
 * @param {boolean} shouldClosePopup - Whether to close the popup after showing notification (defaults to false)
 */
export function showErrorNotification(
    message,
    title = "Schedulr Error",
    isPopup = false,
    shouldClosePopup = false
) {
    console.error(`[${title}] ${message}`);

    if (isPopup) {
        // For popup context, use window.alert
        window.alert(`${title}: ${message}`);

        if (shouldClosePopup) {
            window.close();
        }
    } else {
        // For content script context, send message to popup or show notification
        try {
            // Try to send message to popup first
            chrome.runtime.sendMessage({
                action: "showAlert",
                error: `${title}: ${message}`,
                closePopup: shouldClosePopup,
            });
        } catch {
            // Fallback to browser notification if popup is not available
            if (chrome.notifications) {
                chrome.notifications.create({
                    type: "basic",
                    iconUrl: "/images/magnify128.png",
                    title: title,
                    message: message,
                });
            } else {
                // Last resort: use alert
                window.alert(`${title}: ${message}`);
            }
        }
    }
}

/**
 * Shows a success notification to the user
 * @param {string} message - The success message to display
 * @param {string} title - Optional title for the notification (defaults to "Schedulr Success")
 * @param {boolean} isPopup - Whether this is called from popup context (defaults to false)
 * @param {boolean} shouldClosePopup - Whether to close the popup after showing notification (defaults to false)
 */
export function showSuccessNotification(
    message,
    title = "Schedulr Success",
    isPopup = false,
    shouldClosePopup = false
) {
    console.log(`[${title}] ${message}`);

    if (isPopup) {
        // For popup context, use window.alert
        window.alert(`${title}: ${message}`);

        if (shouldClosePopup) {
            window.close();
        }
    } else {
        // For content script context, send message to popup
        try {
            chrome.runtime.sendMessage({
                action: "showAlert",
                error: `${title}: ${message}`,
                closePopup: shouldClosePopup,
            });
        } catch {
            // Fallback to browser notification
            if (chrome.notifications) {
                chrome.notifications.create({
                    type: "basic",
                    iconUrl: "/images/magnify128.png",
                    title: title,
                    message: message,
                });
            }
        }
    }
}

/**
 * Wraps an async function with error handling
 * @param {Function} asyncFn - The async function to wrap
 * @param {string} errorContext - Context for error messages
 * @param {boolean} isPopup - Whether this is called from popup context
 * @returns {Function} - Wrapped function with error handling
 */
export function withErrorHandling(asyncFn, errorContext, isPopup = false) {
    return async (...args) => {
        try {
            return await asyncFn(...args);
        } catch (error) {
            const errorMessage =
                error.message || "An unexpected error occurred";
            showErrorNotification(errorMessage, errorContext, isPopup);
            throw error;
        }
    };
}
