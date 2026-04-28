import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../core/theme/app_theme.dart';
import '../../../models/media_item.dart';
import 'gallery_grid_screen.dart';

class SlideshowScreen extends ConsumerStatefulWidget {
  const SlideshowScreen({
    super.key,
    required this.projectSlug,
    required this.galleryId,
  });

  final String projectSlug;
  final String galleryId;

  @override
  ConsumerState<SlideshowScreen> createState() => _SlideshowScreenState();
}

class _SlideshowScreenState extends ConsumerState<SlideshowScreen>
    with TickerProviderStateMixin {
  late PageController _pageController;
  Timer? _autoAdvanceTimer;
  bool _isPlaying = true;
  bool _showControls = true;
  int _currentIndex = 0;
  Timer? _hideControlsTimer;

  late AnimationController _fadeController;

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
    _fadeController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
      value: 1.0,
    );

    // Enter immersive mode
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);

    _startAutoAdvance();
    _startHideControlsTimer();
  }

  @override
  void dispose() {
    _autoAdvanceTimer?.cancel();
    _hideControlsTimer?.cancel();
    _pageController.dispose();
    _fadeController.dispose();
    // Restore system UI
    SystemChrome.setEnabledSystemUIMode(
      SystemUiMode.manual,
      overlays: SystemUiOverlay.values,
    );
    super.dispose();
  }

  void _startAutoAdvance() {
    _autoAdvanceTimer?.cancel();
    if (!_isPlaying) return;

    _autoAdvanceTimer = Timer.periodic(
      const Duration(seconds: 5),
      (_) => _nextSlide(),
    );
  }

  void _stopAutoAdvance() {
    _autoAdvanceTimer?.cancel();
  }

  void _togglePlayPause() {
    setState(() {
      _isPlaying = !_isPlaying;
    });
    if (_isPlaying) {
      _startAutoAdvance();
    } else {
      _stopAutoAdvance();
    }
  }

  void _nextSlide() {
    final mediaState = ref.read(galleryMediaProvider(widget.galleryId));
    final photos = mediaState.media.where((m) => m.isPhoto).toList();
    if (photos.isEmpty) return;

    if (_currentIndex < photos.length - 1) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 800),
        curve: Curves.easeInOut,
      );
    } else {
      // Loop back to first
      _pageController.animateToPage(
        0,
        duration: const Duration(milliseconds: 800),
        curve: Curves.easeInOut,
      );
    }
  }

  void _previousSlide() {
    if (_currentIndex > 0) {
      _pageController.previousPage(
        duration: const Duration(milliseconds: 600),
        curve: Curves.easeInOut,
      );
    }
  }

  void _toggleControls() {
    setState(() {
      _showControls = !_showControls;
    });
    if (_showControls) {
      _fadeController.forward();
      _startHideControlsTimer();
    } else {
      _fadeController.reverse();
    }
  }

  void _startHideControlsTimer() {
    _hideControlsTimer?.cancel();
    _hideControlsTimer = Timer(const Duration(seconds: 4), () {
      if (mounted && _showControls) {
        setState(() => _showControls = false);
        _fadeController.reverse();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final mediaState = ref.watch(galleryMediaProvider(widget.galleryId));
    final photos = mediaState.media.where((m) => m.isPhoto).toList();

    return Scaffold(
      backgroundColor: Colors.black,
      body: GestureDetector(
        onTap: _toggleControls,
        child: Stack(
          fit: StackFit.expand,
          children: [
            // Images
            if (photos.isNotEmpty)
              PageView.builder(
                controller: _pageController,
                itemCount: photos.length,
                onPageChanged: (index) {
                  setState(() => _currentIndex = index);
                  if (_isPlaying) _startAutoAdvance();
                },
                itemBuilder: (context, index) {
                  return _SlideshowImage(mediaItem: photos[index]);
                },
              )
            else
              const Center(
                child: CircularProgressIndicator(color: AppColors.gold),
              ),

            // Controls overlay
            if (photos.isNotEmpty)
              FadeTransition(
                opacity: _fadeController,
                child: _buildControls(photos),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildControls(List<MediaItem> photos) {
    return Column(
      children: [
        // Top bar
        Container(
          padding: EdgeInsets.only(
            top: MediaQuery.of(context).padding.top + 8,
            left: 16,
            right: 16,
            bottom: 8,
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
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              // Photo counter
              Text(
                '${_currentIndex + 1} / ${photos.length}',
                style: GoogleFonts.inter(
                  fontSize: 14,
                  color: Colors.white.withOpacity(0.8),
                  fontWeight: FontWeight.w500,
                ),
              ),

              // Close button
              GestureDetector(
                onTap: () => Navigator.of(context).pop(),
                child: Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.15),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.close,
                    color: Colors.white,
                    size: 20,
                  ),
                ),
              ),
            ],
          ),
        ),

        const Spacer(),

        // Bottom controls
        Container(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).padding.bottom + 24,
            left: 32,
            right: 32,
            top: 24,
          ),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.bottomCenter,
              end: Alignment.topCenter,
              colors: [
                Colors.black.withOpacity(0.6),
                Colors.transparent,
              ],
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Previous
              _ControlButton(
                icon: Icons.skip_previous,
                onTap: _previousSlide,
                enabled: _currentIndex > 0,
              ),
              const SizedBox(width: 32),

              // Play/Pause
              GestureDetector(
                onTap: _togglePlayPause,
                child: Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    color: AppColors.gold.withOpacity(0.2),
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: AppColors.gold.withOpacity(0.5),
                      width: 1,
                    ),
                  ),
                  child: Icon(
                    _isPlaying ? Icons.pause : Icons.play_arrow,
                    color: AppColors.gold,
                    size: 28,
                  ),
                ),
              ),
              const SizedBox(width: 32),

              // Next
              _ControlButton(
                icon: Icons.skip_next,
                onTap: _nextSlide,
                enabled: _currentIndex < photos.length - 1,
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _ControlButton extends StatelessWidget {
  const _ControlButton({
    required this.icon,
    required this.onTap,
    this.enabled = true,
  });

  final IconData icon;
  final VoidCallback onTap;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: enabled ? onTap : null,
      child: Container(
        width: 44,
        height: 44,
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(enabled ? 0.1 : 0.05),
          shape: BoxShape.circle,
        ),
        child: Icon(
          icon,
          color: Colors.white.withOpacity(enabled ? 0.8 : 0.3),
          size: 24,
        ),
      ),
    );
  }
}

class _SlideshowImage extends StatelessWidget {
  const _SlideshowImage({required this.mediaItem});

  final MediaItem mediaItem;

  @override
  Widget build(BuildContext context) {
    return CachedNetworkImage(
      imageUrl: mediaItem.displayUrl ?? mediaItem.thumbnailUrl ?? '',
      fit: BoxFit.contain,
      placeholder: (_, __) => const Center(
        child: CircularProgressIndicator(
          color: AppColors.gold,
          strokeWidth: 2,
        ),
      ),
      errorWidget: (_, __, ___) => const Center(
        child: Icon(
          Icons.broken_image_outlined,
          color: AppColors.textTertiary,
          size: 48,
        ),
      ),
    );
  }
}
