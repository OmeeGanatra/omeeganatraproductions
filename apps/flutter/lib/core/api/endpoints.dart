class Endpoints {
  Endpoints._();
  static const String baseUrl = 'https://api-kttj5ltboq-el.a.run.app/api';

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
  static String projectGalleries(String slug) => '/portal/projects/$slug/galleries';
  static String timeline(String slug) => '/portal/projects/$slug/timeline';

  // Portal - Galleries
  static String gallery(String galleryId) => '/portal/galleries/$galleryId';
  static String galleryMedia(String galleryId) => '/portal/galleries/$galleryId/media';
  static String verifyGalleryPassword(String galleryId) => '/portal/galleries/$galleryId/verify-password';
  static String requestZipDownload(String galleryId) => '/portal/galleries/$galleryId/download-zip';

  // Portal - Media
  static String mediaItem(String mediaId) => '/portal/media/$mediaId';
  static String mediaDownloadUrl(String mediaId) => '/portal/media/$mediaId/download-url';

  // Portal - Favorites
  static const String favorites = '/portal/favorites';
  static const String addFavorite = '/portal/favorites';
  static String removeFavorite(String mediaItemId) => '/portal/favorites/$mediaItemId';

  // Portal - Notifications
  static const String notifications = '/portal/notifications';
  static const String markAllNotificationsRead = '/portal/notifications/read-all';
  static String markNotificationRead(String id) => '/portal/notifications/$id/read';

  // Admin - Clients
  static const String adminClients = '/admin/clients';
  static String adminClient(String id) => '/admin/clients/$id';

  // Admin - Projects
  static const String adminProjects = '/admin/projects';
  static String adminProject(String id) => '/admin/projects/$id';
  static String adminProjectGalleries(String projectId) => '/admin/projects/$projectId/galleries';
  static String adminAssignClient(String projectId) => '/admin/projects/$projectId/assign-client';
  static String adminRemoveClient(String projectId, String clientId) => '/admin/projects/$projectId/clients/$clientId';

  // Admin - Galleries
  static String adminGallery(String galleryId) => '/admin/galleries/$galleryId';
  static String adminGalleryPublish(String galleryId) => '/admin/galleries/$galleryId/publish';
  static String adminGalleryMedia(String galleryId) => '/admin/galleries/$galleryId/media';
  static String adminMediaItem(String mediaId) => '/admin/media/$mediaId';
  static String mediaUploadUrls(String galleryId) => '/admin/galleries/$galleryId/media/upload-urls';
  static String mediaConfirmUpload(String galleryId) => '/admin/galleries/$galleryId/media/confirm-upload';

  // Admin - Analytics
  static const String adminAnalyticsDashboard = '/admin/analytics/dashboard';
  static const String adminAnalyticsDownloads = '/admin/analytics/downloads';
  static const String adminAnalyticsStorage = '/admin/analytics/storage';

  // Admin - Notifications
  static const String adminNotificationsSend = '/admin/notifications/send';
  static const String adminNotificationsBroadcast = '/admin/notifications/broadcast';
  static const String adminNotifications = '/admin/notifications';

  // Admin - Team
  static const String adminTeam = '/admin/team';
}
