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

  // Portal - Galleries
  static String galleryMedia(String galleryId) =>
      '/portal/galleries/$galleryId/media';
  static String verifyGalleryPassword(String galleryId) =>
      '/portal/galleries/$galleryId/verify-password';
  static String requestZipDownload(String galleryId) =>
      '/portal/galleries/$galleryId/download-zip';

  // Portal - Media
  static String mediaDownloadUrl(String mediaId) =>
      '/portal/media/$mediaId/download-url';

  // Portal - Favorites
  static const String favorites = '/portal/favorites';
  static String removeFavorite(String mediaItemId) =>
      '/portal/favorites/$mediaItemId';

  // Portal - Notifications
  static const String notifications = '/portal/notifications';
  static String markNotificationRead(String notificationId) =>
      '/portal/notifications/$notificationId/read';
}
