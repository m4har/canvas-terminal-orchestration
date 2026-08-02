export function isAutomationMode(search = window.location.search): boolean {
  return new URLSearchParams(search).has("e2e");
}
