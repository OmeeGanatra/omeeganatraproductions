import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/widgets/cached_image.dart';
import '../../../../shared/widgets/ogp_error_view.dart';
import '../../../../shared/widgets/ogp_shimmer.dart';
import '../providers/admin_galleries_provider.dart';

class AdminGalleryDetailScreen extends ConsumerWidget {
  const AdminGalleryDetailScreen({
    super.key,
    required this.projectId,
    required this.galleryId,
  });
  final String projectId;
  final String galleryId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final params = (projectId: projectId, galleryId: galleryId);
    final galleryAsync = ref.watch(adminGalleryProvider(params));
    final mediaAsync = ref.watch(adminGalleryMediaProvider(params));

    return Scaffold(
      appBar: AppBar(
        title: galleryAsync.maybeWhen(
          data: (g) => Text(g.title),
          orElse: () => const Text('Gallery'),
        ),
        actions: [
          galleryAsync.maybeWhen(
            data: (g) => TextButton(
              onPressed: () {},
              child: Text(
                g.status == 'PUBLISHED' ? 'Unpublish' : 'Publish',
                style: const TextStyle(color: AppColors.gold),
              ),
            ),
            orElse: () => const SizedBox.shrink(),
          ),
        ],
      ),
      body: mediaAsync.when(
        loading: () => const ShimmerGrid(count: 12),
        error: (e, _) => OgpErrorView(
          message: e.toString(),
          onRetry: () => ref.invalidate(adminGalleryMediaProvider(params)),
        ),
        data: (media) {
          if (media.isEmpty) {
            return Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.photo_outlined,
                      size: 64, color: AppColors.textTertiary),
                  const SizedBox(height: 16),
                  const Text('No media yet.',
                      style: TextStyle(color: AppColors.textTertiary)),
                  const SizedBox(height: 16),
                  ElevatedButton.icon(
                    onPressed: () => context.go(
                      '/admin/media-upload?galleryId=$galleryId&projectId=$projectId',
                    ),
                    icon: const Icon(Icons.upload_outlined),
                    label: const Text('Upload Media'),
                  ),
                ],
              ),
            );
          }
          return GridView.builder(
            padding: const EdgeInsets.all(4),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 4,
              crossAxisSpacing: 2,
              mainAxisSpacing: 2,
            ),
            itemCount: media.length,
            itemBuilder: (context, i) {
              final item = media[i];
              return Stack(
                fit: StackFit.expand,
                children: [
                  item.thumbnailUrl != null
                      ? CachedImage(url: item.thumbnailUrl!, fit: BoxFit.cover)
                      : Container(color: AppColors.surfaceDark),
                  if (item.isVideo)
                    const Center(
                      child: Icon(Icons.play_circle_outline,
                          color: Colors.white, size: 24),
                    ),
                  Positioned(
                    top: 4,
                    right: 4,
                    child: GestureDetector(
                      onTap: () {},
                      child: Container(
                        width: 24,
                        height: 24,
                        decoration: BoxDecoration(
                          color: Colors.black54,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: const Icon(Icons.delete_outline,
                            color: Colors.white, size: 14),
                      ),
                    ),
                  ),
                ],
              );
            },
          );
        },
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.go(
          '/admin/media-upload?galleryId=$galleryId&projectId=$projectId',
        ),
        icon: const Icon(Icons.upload_outlined),
        label: const Text('Upload'),
        backgroundColor: AppColors.gold,
        foregroundColor: AppColors.scaffoldDark,
      ),
    );
  }
}
