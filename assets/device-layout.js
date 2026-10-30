// A narrower desktop window must retain the original desktop composition.
// iPadOS can identify as macOS, so use its touch capability as well as the UA.
function portfolioUsesCompactLayout() {
  return navigator.userAgentData?.mobile === true ||
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (/Macintosh|MacIntel/i.test(navigator.userAgent + ' ' + navigator.platform) && navigator.maxTouchPoints > 1);
}
