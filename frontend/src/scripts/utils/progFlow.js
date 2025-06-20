export function getCurrTab() {
    return new Promise ((resolve, reject) => {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            var currTab = tabs[0];
            if (chrome.runtime.lastError || !currTab) {
                reject(new Error('Failed to query the current tab. Please try again later'));
                return;
            } else {
                resolve(currTab);
            }
        });
    });
}
