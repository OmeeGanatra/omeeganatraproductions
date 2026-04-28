import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:photo_view/photo_view.dart';
import 'package:share_plus/share_plus.dart';
import 'package:video_player/video_player.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/endpoints.dart';
import '../../../core/theme/app_theme.dart';
import '../../../models/media_item.dart';

final mediaViewerProvider = StateNotifierProvider.family<MediaViewerNotifier,
    MediaViewerState, String>((ref, mediaId) {
  return MediaViewerNotifier(mediaId);
});

class MediaViewerState {
  final MediaItem? item;
  final bool isLoading;
  final String? error;

  const MediaViewerState({this.item, this.isLoading = false, this.error});

  MediaViewerState copyWith({
    MediaItem? item,
    bool? isLoading,
    String? error,
  }) {
    return MediaViewerState(
      item: item ?? this.item,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class MediaViewerNotifier extends StateNotifier<MediaViewerState> {
  MediaViewerNotifier(this.mediaId) : super(const MediaViewerState()) {
    load();
  }

  final String mediaId;

  Future<void> load() async {
    state = state.copyWith(isLoading: true);
    try {
      final response =
          await ApiClient.instance.get(Endpoints.mediaItem(mediaId));
      final data = response.data as Map<String, dynamic>;
      final item = MediaItem.fromJson(data['media'] ?? data);
      state = state.copyWith(item: item, isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'Failed to load media');
    }
  }

  void toggleFavorite() async {
    if (state.item == null) return;
    final current = state.item!;
    final nowFavorited = !current.isFavorited;
    state = state.copyWith(item: current.copyWith(isFavorited: nowFavorited));
    try {
      if (nowFavorited) {
        await ApiClient.instance
            .post(Endpoints.addFavorite, data: {'mediaItemId': mediaId});
      } else {
        await ApiClient.instance.delete(Endpoints.removeFavorite(mediaId));
      }
    } catch (_) {
      state = state.copyWith(item: current);
    }
  }
}

class MediaViewerScreen extends ConsumerStatefulWidget {
  const MediaViewerScreen({super.key, required this.mediaId});

  final String mediaId;

  @override
  ConsumerState<MediaViewerScreen> createState() => _MediaViewerScreenState();
}

class _MediaViewerScreenState extends ConsumerState<MediaViewerScreen>
    with SingleTickerProviderStateMixin {
  bool _showOverlay = true;
  VideoPlayerController? _videoController;
  late AnimationController _overlayController;

  @override
  void initState() {
    super.initState();
    _overlayController = AnimationController(
      duration: const Duration(milliseconds: 250),
      vsync: this,
      value: 1.0,
    );
  }

  @override
  void dispose() {
    _videoController?.dispose();
    _overlayController.dispose();
    super.dispose();
  }

  void _toggleOverlay() {
    setState(() => _showOverlay = !_showOverlay);
    if (_showOverlay) {
      _overlayController.forward();
      SystemChrome.setEnabledSystemUIMode(
        SystemUiMode.manual,
        overlays: SystemUiOverlay.values,
      );
    } else {
      _overlayController.reverse();
      SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
    }
  }

  void _initVideoPlayer(String url) {
    if (_videoController != null) return;
    _videoController = VideoPlayerController.networkUrl(Uri.parse(url))
      ..initialize().then((_) {
        if (mounted) setState(() {});
        _videoController?.play();
      });
  }

  void _showInfoSheet(BuildContext context, MediaItem item) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surfaceDark,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: AppColors.textTertiary.withOpacity(0.3),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                Text(
                  'Photo Details',
                  style: GoogleFonts.playfairDisplay(
                    fontSize: 20,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 20),
                _InfoRow(label: 'Filename', value: item.filenameOriginal),
                if (item.dimensionsString.isNotEmpty)
                  _InfoRow(label: 'Dimensions', value: item.dimensionsString),
                if (item.formattedFileSize.isNotEmpty)
                  _InfoRow(label: 'File Size', value: item.formattedFileSize),
                _InfoRow(
                  label: 'Type',
                  value: item.isVideo ? 'Video' : 'Photo',
                ),
                if (item.exifData != null) ...[
                  const SizedBox(height: 8),
                  const Divider(color: Color(0xFF333333)),
                  const SizedBox(height: 8),
                  Text(
                    'EXIF Data',
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 12),
                  ...item.exifData!.entries.map((e) => _InfoRow(
                        label: e.key,
                        value: e.value.toString(),
                      )),
                ],
                const SizedBox(height: 8),
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final viewerState = ref.watch(mediaViewerProvider(widget.mediaId));
    final item = viewerState.item;

    return Scaffold(
      backgroundColor: Colors.black,
      body: viewerState.isLoading
          ? const Center(
              child: CircularProgressIndicator(color: AppColors.gold),
            )
          : viewerState.error != null
              ? Center(
                  child: Text(
                    viewerState.error!,
                    style: GoogleFonts.inter(color: AppColors.textSecondary),
                  ),
                )
              : item == null
                  ? const SizedBox.shrink()
                  : GestureDetector(
                      onTap: _toggleOverlay,
                      child: Stack(
                        fit: StackFit.expand,
                        children: [
                          // Content
                          if (item.isVideo && item.videoUrl != null)
                            _buildVideoPlayer(item)
                          else
                            _buildPhotoViewer(item),

                          // Top overlay
                          FadeTransition(
                            opacity: _overlayController,
                            child: _buildTopOverlay(context),
                          ),

                          // Bottom overlay
                          FadeTransition(
                            opacity: _overlayController,
                            child: _buildBottomOverlay(context, item),
                          ),
                        ],
                      ),
                    ),
    );
  }

  Widget _buildPhotoViewer(MediaItem item) {
    return Hero(
      tag: 'media_${item.id}',
      child: PhotoView(
        imageProvider: CachedNetworkImageProvider(
          item.displayUrl ?? item.thumbnailUrl ?? '',
        ),
        minScale: PhotoViewComputedScale.contained,
        maxScale: PhotoViewComputedScale.covered * 3,
        backgroundDecoration: const BoxDecoration(color: Colors.black),
        loadingBuilder: (context, event) {
          return const Center(
            child: CircularProgressIndicator(
              color: AppColors.gold,
              strokeWidth: 2,
            ),
          );
        },
        errorBuilder: (context, error, stackTrace) {
          return const Center(
            child: Icon(
              Icons.broken_image_outlined,
              color: AppColors.textTertiary,
              size: 48,
            ),
          );
        },
      ),
    );
  }

  Widget _buildVideoPlayer(MediaItem item) {
    _initVideoPlayer(item.videoUrl!);

    if (_videoController == null || !_videoController!.value.isInitialized) {
      return const Center(
        child: CircularProgressIndicator(color: AppColors.gold, strokeWidth: 2),
      );
    }

    return Center(
      child: AspectRatio(
        aspectRatio: _videoController!.value.aspectRatio,
        child: Stack(
          alignment: Alignment.center,
          children: [
            VideoPlayer(_videoController!),

            // Play/Pause overlay
            GestureDetector(
              onTap: () {
                setState(() {
                  if (_videoController!.value.isPlaying) {
                    _videoController!.pause();
                  } else {
                    _videoController!.play();
                  }
                });
              },
              child: AnimatedOpacity(
                opacity: _videoController!.value.isPlaying ? 0.0 : 1.0,
                duration: const Duration(milliseconds: 200),
                child: Container(
                  width: 64,
                  height: 64,
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.5),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.play_arrow,
                    color: Colors.white,
                    size: 36,
                  ),
                ),
              ),
            ),

            // Video progress bar
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: VideoProgressIndicator(
                _videoController!,
                allowScrubbing: true,
                colors: const VideoProgressColors(
                  playedColor: AppColors.gold,
                  bufferedColor: Color(0xFF555555),
                  backgroundColor: Color(0xFF333333),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTopOverlay(BuildContext context) {
    return Positioned(
      top: 0,
      left: 0,
      right: 0,
      child: Container(
        padding: EdgeInsets.only(
          top: MediaQuery.of(context).padding.top + 8,
          left: 8,
          right: 8,
          bottom: 16,
        ),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Colors.black.withOpacity(0.6),
              Colors.transparent,
            ],
          ),
        ),
        child: Row(
          children: [
            IconButton(
              onPressed: () => Navigator.of(context).pop(),
              icon: const Icon(
                Icons.arrow_back_ios,
                color: Colors.white,
                size: 20,
              ),
            ),
            const Spacer(),
          ],
        ),
      ),
    );
  }

  Widget _buildBottomOverlay(BuildContext context, MediaItem item) {
    return Positioned(
      bottom: 0,
      left: 0,
      right: 0,
      child: Container(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).padding.bottom + 16,
          left: 24,
          right: 24,
          top: 24,
        ),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.bottomCenter,
            end: Alignment.topCenter,
            colors: [
              Colors.black.withOpacity(0.7),
              Colors.transparent,
            ],
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
            // Favorite
            _ActionButton(
              icon: item.isFavorited ? Icons.favorite : Icons.favorite_outline,
              label: 'Favorite',
              color: item.isFavorited ? AppColors.error : Colors.white,
              onTap: () {
                ref
                    .read(mediaViewerProvider(widget.mediaId).notifier)
                    .toggleFavorite();
              },
            ),

            // Share
            _ActionButton(
              icon: Icons.share_outlined,
              label: 'Share',
              onTap: () {
                final url = item.displayUrl ?? item.thumbnailUrl;
                if (url != null) {
                  Share.share(url);
                }
              },
            ),

            // Download
            _ActionButton(
              icon: Icons.download_outlined,
              label: 'Save',
              onTap: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(
                      'Download started',
                      style: GoogleFonts.inter(),
                    ),
                    backgroundColor: AppColors.surfaceDark,
                  ),
                );
              },
            ),

            // Info
            _ActionButton(
              icon: Icons.info_outline,
              label: 'Info',
              onTap: () => _showInfoSheet(context, item),
            ),
          ],
        ),
      ),
    );
  }
}

class _ActionButton extends StatelessWidget {
  const _ActionButton({
    required this.icon,
    required this.label,
    required this.onTap,
    this.color = Colors.white,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: color, size: 26),
          const SizedBox(height: 6),
          Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 11,
              color: Colors.white.withOpacity(0.7),
            ),
          ),
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 13,
                color: AppColors.textTertiary,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: GoogleFonts.inter(
                fontSize: 13,
                color: AppColors.textPrimary,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
