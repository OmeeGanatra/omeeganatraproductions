import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/widgets/cached_image.dart';
import '../../../../shared/widgets/ogp_error_view.dart';
import '../../../../shared/widgets/ogp_shimmer.dart';
import '../../../../data/models/media_item.dart';
import '../providers/gallery_provider.dart';

class GalleryGridScreen extends ConsumerWidget {
  const GalleryGridScreen({
    super.key,
    required this.projectSlug,
    required this.galleryId,
  });

  final String projectSlug;
  final String galleryId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final galleryAsync = ref.watch(galleryProvider(galleryId));
    final mediaAsync = ref.watch(galleryMediaProvider(galleryId));

    return Scaffold(
      appBar: AppBar(
        title: galleryAsync.maybeWhen(
          data: (g) => Text(g.title),
          orElse: () => const Text('Gallery'),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.slideshow_outlined),
            onPressed: () => context.go(
              '/portal/projects/$projectSlug/galleries/$galleryId/slideshow',
            ),
          ),
        ],
      ),
      body: mediaAsync.when(
        loading: () => const ShimmerGrid(count: 12),
        error: (e, _) => OgpErrorView(
          message: e.toString(),
          onRetry: () => ref.invalidate(galleryMediaProvider(galleryId)),
        ),
        data: (media) {
          if (media.isEmpty) {
            return const Center(
              child: Text(
                'No media in this gallery yet.',
                style: TextStyle(color: AppColors.textTertiary),
              ),
            );
          }
          return GridView.builder(
            padding: const EdgeInsets.all(4),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3,
              crossAxisSpacing: 2,
              mainAxisSpacing: 2,
            ),
            itemCount: media.length,
            itemBuilder: (context, i) {
              final item = media[i];
              return GestureDetector(
                onTap: () => context.go('/portal/media/${item.id}'),
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    item.thumbnailUrl != null
                        ? CachedImage(url: item.thumbnailUrl!, fit: BoxFit.cover)
                        : Container(color: AppColors.surfaceDark),
                    if (item.isVideo)
                      const Center(
                        child: Icon(
                          Icons.play_circle_outline,
                          color: Colors.white,
                          size: 32,
                        ),
                      ),
                    if (item.isFavorited)
                      const Positioned(
                        top: 6,
                        right: 6,
                        child: Icon(Icons.favorite, color: Colors.white, size: 16),
                      ),
                    if (item.type == MediaType.photo && item.isHighlight)
                      const Positioned(
                        top: 6,
                        left: 6,
                        child: Icon(Icons.star, color: AppColors.gold, size: 14),
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
