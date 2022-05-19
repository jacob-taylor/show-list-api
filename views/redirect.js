(function () {
  var app = {
    launchApp: function () {
      var params = new URL(document.location).searchParams;
      var showId = params.get("id");
      var media = params.get("media");

      var OS = this.getMobileOperatingSystem();
      var deeplink =
        "com.now.thelist://share/info?showId=" + showId + "&media=" + media;

      window.location.replace(deeplink);
      this.timer = setTimeout(
        function () {
          this.openWebApp(OS);
        }.bind(this),
        1000
      );
    },
    openWebApp: function (OS) {
      var appStoreLink =
        OS === "android"
          ? "https://play.google.com/store/apps/details?id=com.now.thelist"
          : "https://apps.apple.com/us/app/1624143620";
      window.location.replace(appStoreLink);
    },
    getMobileOperatingSystem: function () {
      var userAgent = navigator.userAgent || navigator.vendor || window.opera;

      if (/android/i.test(userAgent)) {
        return "android";
      }

      // iOS detection from: http://stackoverflow.com/a/9039885/177710
      if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
        return "ios";
      }

      return "unknown";
    },
  };

  app.launchApp();
})();
