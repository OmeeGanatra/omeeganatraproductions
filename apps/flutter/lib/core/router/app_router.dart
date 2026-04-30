import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../auth/auth_provider.dart';
import '../../features/auth/screens/login_screen.dart';
import '../../features/portal/portal_shell.dart';
import '../../features/portal/projects/screens/projects_list_screen.dart';
import '../../features/portal/projects/screens/project_detail_screen.dart';
import '../../features/portal/galleries/screens/gallery_grid_screen.dart';
import '../../features/portal/galleries/screens/slideshow_screen.dart';
import '../../features/portal/media/screens/media_viewer_screen.dart';
import '../../features/portal/favorites/screens/favorites_screen.dart';
import '../../features/portal/notifications/screens/notifications_screen.dart';
import '../../features/portal/profile/screens/profile_screen.dart';
import '../../features/portal/downloads/screens/downloads_screen.dart';
import '../../features/portal/timeline/screens/timeline_screen.dart';
import '../../features/admin/admin_shell.dart';
import '../../features/admin/dashboard/screens/dashboard_screen.dart';
import '../../features/admin/clients/screens/clients_screen.dart';
import '../../features/admin/clients/screens/client_detail_screen.dart';
import '../../features/admin/projects/screens/admin_projects_screen.dart';
import '../../features/admin/projects/screens/admin_project_detail_screen.dart';
import '../../features/admin/galleries/screens/admin_galleries_screen.dart';
import '../../features/admin/media_upload/screens/media_upload_screen.dart';
import '../../features/admin/analytics/screens/analytics_screen.dart';
import '../../features/admin/notifications_admin/screens/notifications_admin_screen.dart';
import '../../features/admin/team/screens/team_screen.dart';
import '../../features/admin/settings/screens/settings_screen.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>(debugLabel: 'root');
final _portalShellKey = GlobalKey<NavigatorState>(debugLabel: 'portalShell');
final _adminShellKey = GlobalKey<NavigatorState>(debugLabel: 'adminShell');

// Portal branch navigator keys
final _portalProjectsKey = GlobalKey<NavigatorState>(debugLabel: 'projects');
final _portalFavoritesKey = GlobalKey<NavigatorState>(debugLabel: 'favorites');
final _portalNotificationsKey =
    GlobalKey<NavigatorState>(debugLabel: 'notifications');
final _portalProfileKey = GlobalKey<NavigatorState>(debugLabel: 'profile');

// Admin branch navigator keys
final _adminDashboardKey = GlobalKey<NavigatorState>(debugLabel: 'dashboard');
final _adminClientsKey = GlobalKey<NavigatorState>(debugLabel: 'adminClients');
final _adminProjectsKey =
    GlobalKey<NavigatorState>(debugLabel: 'adminProjects');
final _adminGalleriesKey =
    GlobalKey<NavigatorState>(debugLabel: 'adminGalleries');
final _adminUploadKey = GlobalKey<NavigatorState>(debugLabel: 'adminUpload');
final _adminAnalyticsKey =
    GlobalKey<NavigatorState>(debugLabel: 'adminAnalytics');
final _adminNotifyKey = GlobalKey<NavigatorState>(debugLabel: 'adminNotify');
final _adminTeamKey = GlobalKey<NavigatorState>(debugLabel: 'adminTeam');
final _adminSettingsKey =
    GlobalKey<NavigatorState>(debugLabel: 'adminSettings');

final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: '/portal/projects',
    debugLogDiagnostics: false,
    redirect: (context, state) {
      final authState = ref.read(authStateProvider);
      final isAuthed = authState.valueOrNull != null;
      final isOnLogin = state.matchedLocation == '/login';

      // Still loading — don't redirect yet
      if (authState.isLoading) return null;

      if (!isAuthed && !isOnLogin) return '/login';

      if (isAuthed && isOnLogin) {
        final user = ref.read(authProvider).user;
        return user?.isAdmin == true ? '/admin/dashboard' : '/portal/projects';
      }

      // Clients can't access admin routes
      final user = ref.read(authProvider).user;
      if (isAuthed &&
          user?.isClient == true &&
          state.matchedLocation.startsWith('/admin')) {
        return '/portal/projects';
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),

      // Portal shell with 4 tabs
      StatefulShellRoute.indexedStack(
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state, navigationShell) {
          return PortalShell(navigationShell: navigationShell);
        },
        branches: [
          StatefulShellBranch(
            navigatorKey: _portalProjectsKey,
            routes: [
              GoRoute(
                path: '/portal/projects',
                builder: (context, state) => const ProjectsListScreen(),
                routes: [
                  GoRoute(
                    path: ':slug',
                    builder: (context, state) => ProjectDetailScreen(
                      slug: state.pathParameters['slug']!,
                    ),
                    routes: [
                      GoRoute(
                        path: 'galleries/:galleryId',
                        builder: (context, state) => GalleryGridScreen(
                          projectSlug: state.pathParameters['slug']!,
                          galleryId: state.pathParameters['galleryId']!,
                        ),
                        routes: [
                          GoRoute(
                            path: 'slideshow',
                            parentNavigatorKey: _rootNavigatorKey,
                            builder: (context, state) => SlideshowScreen(
                              projectSlug: state.pathParameters['slug']!,
                              galleryId: state.pathParameters['galleryId']!,
                            ),
                          ),
                        ],
                      ),
                      GoRoute(
                        path: 'timeline',
                        builder: (context, state) => TimelineScreen(
                          projectSlug: state.pathParameters['slug']!,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
          StatefulShellBranch(
            navigatorKey: _portalFavoritesKey,
            routes: [
              GoRoute(
                path: '/portal/favorites',
                builder: (context, state) => const FavoritesScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            navigatorKey: _portalNotificationsKey,
            routes: [
              GoRoute(
                path: '/portal/notifications',
                builder: (context, state) => const NotificationsScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            navigatorKey: _portalProfileKey,
            routes: [
              GoRoute(
                path: '/portal/profile',
                builder: (context, state) => const ProfileScreen(),
                routes: [
                  GoRoute(
                    path: 'downloads',
                    builder: (context, state) => const DownloadsScreen(),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),

      // Media viewer fullscreen (outside any shell)
      GoRoute(
        path: '/portal/media/:id',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => MediaViewerScreen(
          mediaId: state.pathParameters['id']!,
        ),
      ),

      // Admin shell with 9 tabs
      StatefulShellRoute.indexedStack(
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state, navigationShell) {
          return AdminShell(navigationShell: navigationShell);
        },
        branches: [
          StatefulShellBranch(
            navigatorKey: _adminDashboardKey,
            routes: [
              GoRoute(
                path: '/admin/dashboard',
                builder: (context, state) => const DashboardScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            navigatorKey: _adminClientsKey,
            routes: [
              GoRoute(
                path: '/admin/clients',
                builder: (context, state) => const ClientsScreen(),
                routes: [
                  GoRoute(
                    path: ':id',
                    builder: (context, state) => ClientDetailScreen(
                      clientId: state.pathParameters['id']!,
                    ),
                  ),
                ],
              ),
            ],
          ),
          StatefulShellBranch(
            navigatorKey: _adminProjectsKey,
            routes: [
              GoRoute(
                path: '/admin/projects',
                builder: (context, state) => const AdminProjectsScreen(),
                routes: [
                  GoRoute(
                    path: ':id',
                    builder: (context, state) => AdminProjectDetailScreen(
                      projectId: state.pathParameters['id']!,
                    ),
                  ),
                ],
              ),
            ],
          ),
          StatefulShellBranch(
            navigatorKey: _adminGalleriesKey,
            routes: [
              GoRoute(
                // projectId passed as query param: /admin/galleries/:galleryId?projectId=xxx
                path: '/admin/galleries/:galleryId',
                builder: (context, state) => AdminGalleryDetailScreen(
                  projectId:
                      state.uri.queryParameters['projectId'] ?? '',
                  galleryId: state.pathParameters['galleryId']!,
                ),
              ),
            ],
          ),
          StatefulShellBranch(
            navigatorKey: _adminUploadKey,
            routes: [
              GoRoute(
                path: '/admin/media-upload',
                builder: (context, state) => MediaUploadScreen(
                  galleryId: state.uri.queryParameters['galleryId'],
                  projectId: state.uri.queryParameters['projectId'],
                ),
              ),
            ],
          ),
          StatefulShellBranch(
            navigatorKey: _adminAnalyticsKey,
            routes: [
              GoRoute(
                path: '/admin/analytics',
                builder: (context, state) => const AnalyticsScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            navigatorKey: _adminNotifyKey,
            routes: [
              GoRoute(
                path: '/admin/notifications',
                builder: (context, state) => const NotificationsAdminScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            navigatorKey: _adminTeamKey,
            routes: [
              GoRoute(
                path: '/admin/team',
                builder: (context, state) => const TeamScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            navigatorKey: _adminSettingsKey,
            routes: [
              GoRoute(
                path: '/admin/settings',
                builder: (context, state) => const SettingsScreen(),
              ),
            ],
          ),
        ],
      ),
    ],
  );
});
