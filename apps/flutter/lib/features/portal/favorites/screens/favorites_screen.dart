import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
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
        data: (ids) {
          if (ids.isEmpty) {
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
            itemCount: ids.length,
            itemBuilder: (context, i) {
              final mediaId = ids[i];
              return GestureDetector(
                onTap: () => context.go('/portal/media/$mediaId'),
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    // Without a cached thumbnail URL here, show a placeholder.
                    // Full media details are loaded in MediaViewerScreen.
                    Container(
                      color: Colors.grey[900],
                      child: const Center(
                        child: Icon(Icons.photo_outlined,
                            color: Colors.white38, size: 32),
                      ),
                    ),
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
