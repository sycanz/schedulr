export async function isNotANewcomer() {
    const items = await chrome.storage.local.get("selectedSemesterValues");

    if (items.selectedSemesterValues) {
        return true;
    }

    return false;
}
