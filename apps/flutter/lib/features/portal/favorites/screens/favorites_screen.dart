import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/widgets/cached_image.dart';
import '../../../../shared/widgets/ogp_empty_state.dart';
import '../../../../shared/widgets/ogp_error_view.dart';
import '../../../../shared/widgets/ogp_shimmer.dart';
import '../providers/favorites_provider.dart';

class FavoritesScreen extends ConsumerWidget {
  const FavoritesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(favoritesProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Favorites')),
      body: state.when(
        loading: () => const ShimmerGrid(count: 9),
        error: (e, _) => OgpErrorView(
          message: e.toString(),
          onRetry: () => ref.read(favoritesProvider.notifier).refresh(),
        ),
        data: (items) {
          if (items.isEmpty) {
            return const OgpEmptyState(
              message: 'No favorites yet.\nTap the heart on any photo.',
              icon: Icons.favorite_outline,
            );
          }
          return GridView.builder(
            padding: const EdgeInsets.all(4),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3,
              crossAxisSpacing: 2,
              mainAxisSpacing: 2,
            ),
            itemCount: items.length,
            itemBuilder: (context, i) {
              final item = items[i];
              return GestureDetector(
                onTap: () => context.go('/portal/media/${item.id}'),
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    item.thumbnailUrl != null
                        ? CachedImage(url: item.thumbnailUrl!, fit: BoxFit.cover)
                        : Container(color: AppColors.surfaceDark),
                    const Positioned(
                      top: 6,
                      right: 6,
                      child: Icon(Icons.favorite, color: Colors.red, size: 16),
                    ),
                  ],
                ),
              );
            },
          );
        },
      ),
    );
  }
}
