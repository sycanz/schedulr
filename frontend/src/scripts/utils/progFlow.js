export function getCurrTab() {
    return new Promise((resolve, reject) => {
        chrome.tabs.query(
            { active: true, currentWindow: true },
            function (tabs) {
                var currTab = tabs[0];
                if (chrome.runtime.lastError || !currTab) {
                    const errorMessage = chrome.runtime.lastError
                        ? chrome.runtime.lastError.message
                        : "No active tab found";
                    reject(
                        new Error(
                            `Failed to query the current tab: ${errorMessage}`
                        )
                    );
                    return;
                } else {
                    resolve(currTab);
                }
            }
        );
    });
}
