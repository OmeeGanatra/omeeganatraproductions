class Endpoints {
  Endpoints._();

  // Base — must include /api so the path matches the server's prefix.
  static const String baseUrl = 'https://api.omeeganatra.com/api';

  // Auth
  static const String authClientLogin = '/auth/client/login';
  static const String authAdminLogin = '/auth/admin/login';
  static const String authVerifyOtp = '/auth/verify-otp';
  static const String authRefresh = '/auth/refresh';
  static const String authLogout = '/auth/logout';
  static const String authMe = '/auth/me';
  static const String authForgotPassword = '/auth/forgot-password';
  static const String authResetPassword = '/auth/reset-password';

  // Portal - Projects
  static const String projects = '/portal/projects';
  static String project(String slug) => '/portal/projects/$slug';
  static String projectGalleries(String slug) =>
      '/portal/projects/$slug/galleries';
  static String timeline(String slug) => '/portal/projects/$slug/timeline';

  // Portal - Galleries
  static String gallery(String galleryId) => '/portal/galleries/$galleryId';
  static String galleryMedia(String galleryId) =>
      '/portal/galleries/$galleryId/media';
  static String verifyGalleryPassword(String galleryId) =>
      '/portal/galleries/$galleryId/verify-password';
  static String requestZipDownload(String galleryId) =>
      '/portal/galleries/$galleryId/download-zip';

  // Portal - Media
  static String mediaItem(String mediaId) => '/portal/media/$mediaId';
  static String mediaDownloadUrl(String mediaId) =>
      '/portal/media/$mediaId/download-url';

  // Portal - Favorites
  static const String favorites = '/portal/favorites';
  static const String addFavorite = '/portal/favorites';
  static String removeFavorite(String mediaItemId) =>
      '/portal/favorites/$mediaItemId';

  // Portal - Push devices
  static const String registerDevice = '/portal/devices';
  static const String unregisterDevice = '/portal/devices/unregister';

  // Portal - Notifications
  static const String notifications = '/portal/notifications';
  static const String markAllNotificationsRead =
      '/portal/notifications/read-all';
  static String markNotificationRead(String notificationId) =>
      '/portal/notifications/$notificationId/read';
}
