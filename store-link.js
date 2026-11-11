// "Get the app" in the top bar: phones go straight to their own store;
// computers and anything unrecognised scroll to the download section (#get).
(function () {
  var a = document.querySelector('.nav .get');
  if (!a) return;
  var ua = navigator.userAgent || '';
  // iPadOS asks for desktop sites and reports itself as a Mac, but has a touch screen.
  var apple = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  var android = /Android/i.test(ua);
  if (apple) {
    a.href = 'https://apps.apple.com/us/app/getcrewmate/id6776444100';
    a.setAttribute('data-umami-event-store', 'App Store');
  } else if (android) {
    a.href = 'https://play.google.com/store/apps/details?id=com.weismon.crewmate';
    a.setAttribute('data-umami-event-store', 'Google Play');
  } else {
    a.setAttribute('data-umami-event-store', 'none (scrolls to download)');
  }
})();
