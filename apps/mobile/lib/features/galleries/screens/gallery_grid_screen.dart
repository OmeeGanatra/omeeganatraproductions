import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_staggered_grid_view/flutter_staggered_grid_view.dart';
import 'package:shimmer/shimmer.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/endpoints.dart';
import '../../../core/theme/app_theme.dart';
import '../../../models/media_item.dart';
import '../../../models/gallery.dart';
import '../widgets/photo_tile.dart';

final galleryMediaProvider = StateNotifierProvider.family<
    GalleryMediaNotifier, GalleryMediaState, String>((ref, galleryId) {
  return GalleryMediaNotifier(galleryId);
});

class GalleryMediaState {
  final Gallery? gallery;
  final List<MediaItem> media;
  final bool isLoading;
  final String? error;

  const GalleryMediaState({
    this.gallery,
    this.media = const [],
    this.isLoading = false,
    this.error,
  });

  GalleryMediaState copyWith({
    Gallery? gallery,
    List<MediaItem>? media,
    bool? isLoading,
    String? error,
  }) {
    return GalleryMediaState(
      gallery: gallery ?? this.gallery,
      media: media ?? this.media,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class GalleryMediaNotifier extends StateNotifier<GalleryMediaState> {
  GalleryMediaNotifier(this.galleryId)
      : super(const GalleryMediaState());

  final String galleryId;
  String? _projectSlug;

  Future<void> load(String projectSlug) async {
    _projectSlug = projectSlug;
    state = state.copyWith(isLoading: true);

    try {
      // Load gallery details
      final galleryRes = await ApiClient.instance
          .get(Endpoints.gallery(projectSlug, galleryId));
      final galData = galleryRes.data as Map<String, dynamic>;
      final gallery =
          Gallery.fromJson(galData['gallery'] ?? galData);

      // Load media items
      final mediaRes = await ApiClient.instance
          .get(Endpoints.media(projectSlug, galleryId));
      final mData = mediaRes.data;
      final List<dynamic> items = mData is Map
          ? (mData['media'] ?? mData['data'] ?? [])
          : mData;
      final media = items
          .map((m) => MediaItem.fromJson(m as Map<String, dynamic>))
          .toList();

      state = state.copyWith(
        gallery: gallery,
        media: media,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Failed to load gallery',
      );
    }
  }

  void toggleFavorite(String mediaId) async {
    final index = state.media.indexWhere((m) => m.id == mediaId);
    if (index == -1) return;

    final item = state.media[index];
    final updated = item.copyWith(isFavorited: !item.isFavorited);
    final newMedia = List<MediaItem>.from(state.media);
    newMedia[index] = updated;
    state = state.copyWith(media: newMedia);

    try {
      await ApiClient.instance.post(Endpoints.toggleFavorite(mediaId));
    } catch (_) {
      // Revert on error
      newMedia[index] = item;
      state = state.copyWith(media: newMedia);
    }
  }
}

class GalleryGridScreen extends ConsumerStatefulWidget {
  const GalleryGridScreen({
    super.key,
    required this.projectSlug,
    required this.galleryId,
  });

  final String projectSlug;
  final String galleryId;

  @override
  ConsumerState<GalleryGridScreen> createState() => _GalleryGridScreenState();
}

class _GalleryGridScreenState extends ConsumerState<GalleryGridScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      ref
          .read(galleryMediaProvider(widget.galleryId).notifier)
          .load(widget.projectSlug);
    });
  }

  @override
  Widget build(BuildContext context) {
    final mediaState = ref.watch(galleryMediaProvider(widget.galleryId));

    return Scaffold(
      appBar: AppBar(
        title: Text(
          mediaState.gallery?.title ?? 'Gallery',
          style: GoogleFonts.playfairDisplay(fontSize: 18),
        ),
        leading: IconButton(
          onPressed: () => context.pop(),
          icon: const Icon(Icons.arrow_back_ios, size: 18),
        ),
        actions: [
          // Slideshow button
          IconButton(
            onPressed: mediaState.media.isNotEmpty
                ? () {
                    context.go(
                      '/projects/${widget.projectSlug}/galleries/${widget.galleryId}/slideshow',
                    );
                  }
                : null,
            icon: const Icon(Icons.slideshow_outlined, size: 22),
            tooltip: 'Slideshow',
          ),
          // Download all
          if (mediaState.gallery?.downloadEnabled == true)
            IconButton(
              onPressed: () {
                _showDownloadOptions(context);
              },
              icon: const Icon(Icons.download_outlined, size: 22),
              tooltip: 'Download',
            ),
        ],
      ),
      body: _buildBody(context, mediaState),
    );
  }

  Widget _buildBody(BuildContext context, GalleryMediaState state) {
    if (state.isLoading && state.media.isEmpty) {
      return _buildShimmerGrid();
    }

    if (state.error != null && state.media.isEmpty) {
      return Center(
        child: Text(
          state.error!,
          style: GoogleFonts.inter(
            color: AppColors.textSecondary,
            fontSize: 15,
          ),
        ),
      );
    }

    if (state.media.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.photo_library_outlined,
              size: 56,
              color: AppColors.textTertiary.withOpacity(0.3),
            ),
            const SizedBox(height: 12),
            Text(
              'No photos yet',
              style: GoogleFonts.inter(
                fontSize: 15,
                color: AppColors.textTertiary,
              ),
            ),
          ],
        ),
      );
    }

    return MasonryGridView.count(
      crossAxisCount: 3,
      mainAxisSpacing: 3,
      crossAxisSpacing: 3,
      padding: const EdgeInsets.all(3),
      itemCount: state.media.length,
      itemBuilder: (context, index) {
        final item = state.media[index];
        return PhotoTile(
          mediaItem: item,
          onTap: () => context.go('/media/${item.id}'),
          onFavoriteToggle: () {
            ref
                .read(galleryMediaProvider(widget.galleryId).notifier)
                .toggleFavorite(item.id);
          },
          onLongPress: () => _showMediaOptions(context, item),
        );
      },
    );
  }

  Widget _buildShimmerGrid() {
    return MasonryGridView.count(
      crossAxisCount: 3,
      mainAxisSpacing: 3,
      crossAxisSpacing: 3,
      padding: const EdgeInsets.all(3),
      itemCount: 15,
      itemBuilder: (context, index) {
        final height = 120.0 + (index % 3) * 40.0;
        return Shimmer.fromColors(
          baseColor: AppColors.surfaceDark,
          highlightColor: AppColors.elevatedDark,
          child: Container(
            height: height,
            decoration: BoxDecoration(
              color: AppColors.surfaceDark,
              borderRadius: BorderRadius.circular(4),
            ),
          ),
        );
      },
    );
  }

  void _showMediaOptions(BuildContext context, MediaItem item) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surfaceDark,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(height: 8),
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.textTertiary.withOpacity(0.3),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 16),
              ListTile(
                leading: Icon(
                  item.isFavorited
                      ? Icons.favorite
                      : Icons.favorite_outline,
                  color: item.isFavorited
                      ? AppColors.error
                      : AppColors.textSecondary,
                ),
                title: Text(
                  item.isFavorited
                      ? 'Remove from Favorites'
                      : 'Add to Favorites',
                  style: GoogleFonts.inter(color: AppColors.textPrimary),
                ),
                onTap: () {
                  ref
                      .read(
                          galleryMediaProvider(widget.galleryId).notifier)
                      .toggleFavorite(item.id);
                  Navigator.pop(context);
                },
              ),
              ListTile(
                leading: const Icon(
                  Icons.download_outlined,
                  color: AppColors.textSecondary,
                ),
                title: Text(
                  'Download',
                  style: GoogleFonts.inter(color: AppColors.textPrimary),
                ),
                onTap: () {
                  Navigator.pop(context);
                  // Trigger download
                },
              ),
              ListTile(
                leading: const Icon(
                  Icons.share_outlined,
                  color: AppColors.textSecondary,
                ),
                title: Text(
                  'Share',
                  style: GoogleFonts.inter(color: AppColors.textPrimary),
                ),
                onTap: () {
                  Navigator.pop(context);
                  // Trigger share
                },
              ),
              const SizedBox(height: 8),
            ],
          ),
        );
      },
    );
  }

  void _showDownloadOptions(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surfaceDark,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(height: 8),
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.textTertiary.withOpacity(0.3),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 16),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Text(
                  'Download Options',
                  style: GoogleFonts.playfairDisplay(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                ),
              ),
              const SizedBox(height: 16),
              ListTile(
                leading: const Icon(
                  Icons.download_outlined,
                  color: AppColors.gold,
                ),
                title: Text(
                  'Download All Photos',
                  style: GoogleFonts.inter(color: AppColors.textPrimary),
                ),
                subtitle: Text(
                  'Save entire gallery for offline viewing',
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    color: AppColors.textTertiary,
                  ),
                ),
                onTap: () {
                  Navigator.pop(context);
                },
              ),
              ListTile(
                leading: const Icon(
                  Icons.favorite_outline,
                  color: AppColors.gold,
                ),
                title: Text(
                  'Download Favorites Only',
                  style: GoogleFonts.inter(color: AppColors.textPrimary),
                ),
                subtitle: Text(
                  'Save only your favorited photos',
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    color: AppColors.textTertiary,
                  ),
                ),
                onTap: () {
                  Navigator.pop(context);
                },
              ),
              const SizedBox(height: 16),
            ],
          ),
        );
      },
    );
  }
}
