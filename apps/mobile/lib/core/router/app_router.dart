import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../auth/auth_provider.dart';
import '../theme/app_theme.dart';
import '../../features/auth/screens/login_screen.dart';
import '../../features/auth/screens/otp_screen.dart';
import '../../features/projects/screens/projects_list_screen.dart';
import '../../features/projects/screens/project_detail_screen.dart';
import '../../features/galleries/screens/gallery_grid_screen.dart';
import '../../features/galleries/screens/slideshow_screen.dart';
import '../../features/media/screens/media_viewer_screen.dart';
import '../../features/favorites/screens/favorites_screen.dart';
import '../../features/notifications/screens/notifications_screen.dart';
import '../../features/profile/screens/profile_screen.dart';
import '../../features/downloads/screens/downloads_screen.dart';
import '../../features/timeline/screens/timeline_screen.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>();
final _shellNavigatorKey = GlobalKey<NavigatorState>();

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);

  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: '/projects',
    debugLogDiagnostics: true,
    redirect: (context, state) {
      final isAuthenticated = authState.isAuthenticated;
      final isLoading = authState.isLoading;
      final isLoginRoute = state.matchedLocation == '/login';
      final isOtpRoute = state.matchedLocation == '/otp';

      // While loading, don't redirect
      if (isLoading) return null;

      // If not authenticated and not on login/otp page, redirect to login
      if (!isAuthenticated && !isLoginRoute && !isOtpRoute) {
        return '/login';
      }

      // If authenticated and on login/otp page, redirect to home
      if (isAuthenticated && (isLoginRoute || isOtpRoute)) {
        return '/projects';
      }

      // If OTP required but not on OTP page
      if (authState.requiresOtp && !isOtpRoute && isLoginRoute) {
        return '/otp';
      }

      return null;
    },
    routes: [
      // Auth routes
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/otp',
        builder: (context, state) => const OTPScreen(),
      ),

      // Main shell with bottom navigation
      ShellRoute(
        navigatorKey: _shellNavigatorKey,
        builder: (context, state, child) {
          return _ShellScaffold(child: child);
        },
        routes: [
          GoRoute(
            path: '/projects',
            builder: (context, state) => const ProjectsListScreen(),
            routes: [
              GoRoute(
                path: ':slug',
                builder: (context, state) {
                  final slug = state.pathParameters['slug']!;
                  return ProjectDetailScreen(slug: slug);
                },
                routes: [
                  GoRoute(
                    path: 'galleries/:galleryId',
                    builder: (context, state) {
                      final slug = state.pathParameters['slug']!;
                      final galleryId = state.pathParameters['galleryId']!;
                      return GalleryGridScreen(
                        projectSlug: slug,
                        galleryId: galleryId,
                      );
                    },
                    routes: [
                      GoRoute(
                        path: 'slideshow',
                        parentNavigatorKey: _rootNavigatorKey,
                        builder: (context, state) {
                          final slug = state.pathParameters['slug']!;
                          final galleryId =
                              state.pathParameters['galleryId']!;
                          return SlideshowScreen(
                            projectSlug: slug,
                            galleryId: galleryId,
                          );
                        },
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'timeline',
                    builder: (context, state) {
                      final slug = state.pathParameters['slug']!;
                      return TimelineScreen(projectSlug: slug);
                    },
                  ),
                ],
              ),
            ],
          ),
          GoRoute(
            path: '/favorites',
            builder: (context, state) => const FavoritesScreen(),
          ),
          GoRoute(
            path: '/notifications',
            builder: (context, state) => const NotificationsScreen(),
          ),
          GoRoute(
            path: '/profile',
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

      // Fullscreen media viewer (outside shell)
      GoRoute(
        path: '/media/:id',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) {
          final mediaId = state.pathParameters['id']!;
          return MediaViewerScreen(mediaId: mediaId);
        },
      ),
    ],
  );
});

class _ShellScaffold extends StatelessWidget {
  const _ShellScaffold({required this.child});

  final Widget child;

  int _currentIndex(BuildContext context) {
    final location = GoRouterState.of(context).matchedLocation;
    if (location.startsWith('/projects')) return 0;
    if (location.startsWith('/favorites')) return 1;
    if (location.startsWith('/notifications')) return 2;
    if (location.startsWith('/profile')) return 3;
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    final index = _currentIndex(context);

    return Scaffold(
      body: child,
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          border: Border(
            top: BorderSide(
              color: AppColors.surfaceDark.withOpacity(0.5),
              width: 0.5,
            ),
          ),
        ),
        child: BottomNavigationBar(
          currentIndex: index,
          onTap: (i) {
            switch (i) {
              case 0:
                context.go('/projects');
                break;
              case 1:
                context.go('/favorites');
                break;
              case 2:
                context.go('/notifications');
                break;
              case 3:
                context.go('/profile');
                break;
            }
          },
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.photo_library_outlined),
              activeIcon: Icon(Icons.photo_library),
              label: 'Events',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.favorite_outline),
              activeIcon: Icon(Icons.favorite),
              label: 'Favorites',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.notifications_outlined),
              activeIcon: Icon(Icons.notifications),
              label: 'Alerts',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.person_outline),
              activeIcon: Icon(Icons.person),
              label: 'Profile',
            ),
          ],
        ),
      ),
    );
  }
}
