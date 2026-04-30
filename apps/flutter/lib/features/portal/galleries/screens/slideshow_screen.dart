import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:photo_view/photo_view.dart';
import 'package:photo_view/photo_view_gallery.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../../core/theme/app_theme.dart';
import '../providers/gallery_provider.dart';

class SlideshowScreen extends ConsumerStatefulWidget {
  const SlideshowScreen({
    super.key,
    required this.projectSlug,
    required this.galleryId,
    this.initialIndex = 0,
  });

  final String projectSlug;
  final String galleryId;
  final int initialIndex;

  @override
  ConsumerState<SlideshowScreen> createState() => _SlideshowScreenState();
}

class _SlideshowScreenState extends ConsumerState<SlideshowScreen> {
  late final PageController _pageController;
  int _currentIndex = 0;

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialIndex;
    _pageController = PageController(initialPage: widget.initialIndex);
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final params = (projectId: widget.projectSlug, galleryId: widget.galleryId);
    final mediaAsync = ref.watch(galleryMediaProvider(params));

    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        foregroundColor: Colors.white,
        title: mediaAsync.maybeWhen(
          data: (media) => Text('${_currentIndex + 1} / ${media.length}'),
          orElse: () => const SizedBox.shrink(),
        ),
      ),
      body: mediaAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: Text(e.toString(), style: const TextStyle(color: Colors.white)),
        ),
        data: (media) {
          if (media.isEmpty) {
            return const Center(
              child: Text('No media.', style: TextStyle(color: Colors.white)),
            );
          }
          return PhotoViewGallery.builder(
            pageController: _pageController,
            itemCount: media.length,
            onPageChanged: (i) => setState(() => _currentIndex = i),
            builder: (context, i) {
              final item = media[i];
              final url = item.displayUrl ?? item.thumbnailUrl ?? '';
              return PhotoViewGalleryPageOptions(
                imageProvider: CachedNetworkImageProvider(url),
                minScale: PhotoViewComputedScale.contained,
                maxScale: PhotoViewComputedScale.covered * 3,
                heroAttributes: PhotoViewHeroAttributes(tag: item.id),
              );
            },
            loadingBuilder: (_, __) => const Center(
              child: CircularProgressIndicator(color: AppColors.gold),
            ),
          );
        },
      ),
    );
  }
}
