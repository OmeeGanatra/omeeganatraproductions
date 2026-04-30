import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:photo_view/photo_view.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/widgets/label_mono.dart';
import '../providers/media_provider.dart';
import '../../favorites/providers/favorites_provider.dart';

class MediaViewerScreen extends ConsumerWidget {
  const MediaViewerScreen({super.key, required this.mediaId});
  final String mediaId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final mediaAsync = ref.watch(mediaItemProvider(mediaId));

    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        foregroundColor: Colors.white,
        actions: [
          mediaAsync.maybeWhen(
            data: (item) {
              final isFav = ref.watch(favoritesProvider).valueOrNull?.contains(item.id) ?? item.isFavorited;
              return IconButton(
                icon: Icon(
                  isFav ? Icons.favorite : Icons.favorite_outline,
                  color: isFav ? Colors.red : Colors.white,
                ),
                onPressed: () => ref
                    .read(favoritesProvider.notifier)
                    .toggle(item.id),
              );
            },
            orElse: () => const SizedBox.shrink(),
          ),
          IconButton(
            icon: const Icon(Icons.download_outlined, color: Colors.white),
            onPressed: () async {
              final url = await ref
                  .read(mediaDownloadUrlProvider(mediaId).future);
              if (url.isNotEmpty) {
                await launchUrl(Uri.parse(url));
              }
            },
          ),
        ],
      ),
      body: mediaAsync.when(
        loading: () => const Center(
          child: CircularProgressIndicator(color: AppColors.gold),
        ),
        error: (e, _) => Center(
          child: Text(e.toString(), style: const TextStyle(color: Colors.white)),
        ),
        data: (item) {
          final url = item.displayUrl ?? item.thumbnailUrl ?? '';
          return Stack(
            children: [
              if (item.isPhoto)
                PhotoView(
                  imageProvider: NetworkImage(url),
                  heroAttributes: PhotoViewHeroAttributes(tag: item.id),
                  minScale: PhotoViewComputedScale.contained,
                  maxScale: PhotoViewComputedScale.covered * 3,
                )
              else
                Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.videocam_outlined, color: Colors.white, size: 64),
                      const SizedBox(height: 16),
                      TextButton(
                        onPressed: () async {
                          final videoUrl = item.videoUrl ?? '';
                          if (videoUrl.isNotEmpty) {
                            await launchUrl(Uri.parse(videoUrl));
                          }
                        },
                        child: const Text('Open Video', style: TextStyle(color: AppColors.gold)),
                      ),
                    ],
                  ),
                ),
              Positioned(
                bottom: 0,
                left: 0,
                right: 0,
                child: Container(
                  color: Colors.black54,
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        item.filenameOriginal,
                        style: const TextStyle(color: Colors.white, fontSize: 13),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          if (item.dimensionsString.isNotEmpty)
                            LabelMono(item.dimensionsString, color: Colors.white54),
                          if (item.formattedFileSize.isNotEmpty) ...[
                            const SizedBox(width: 12),
                            LabelMono(item.formattedFileSize, color: Colors.white54),
                          ],
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
