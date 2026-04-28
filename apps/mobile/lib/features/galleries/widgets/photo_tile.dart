import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:shimmer/shimmer.dart';
import '../../../core/theme/app_theme.dart';
import '../../../models/media_item.dart';

class PhotoTile extends StatefulWidget {
  const PhotoTile({
    super.key,
    required this.mediaItem,
    required this.onTap,
    this.onFavoriteToggle,
    this.onLongPress,
    this.showFavoriteIcon = true,
    this.borderRadius = 4.0,
  });

  final MediaItem mediaItem;
  final VoidCallback onTap;
  final VoidCallback? onFavoriteToggle;
  final VoidCallback? onLongPress;
  final bool showFavoriteIcon;
  final double borderRadius;

  @override
  State<PhotoTile> createState() => _PhotoTileState();
}

class _PhotoTileState extends State<PhotoTile>
    with SingleTickerProviderStateMixin {
  late AnimationController _scaleController;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _scaleController = AnimationController(
      duration: const Duration(milliseconds: 100),
      vsync: this,
      lowerBound: 0.0,
      upperBound: 0.03,
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 0.97).animate(
      CurvedAnimation(parent: _scaleController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _scaleController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final item = widget.mediaItem;
    final aspectRatio = item.aspectRatio;
    // Calculate a reasonable height based on aspect ratio
    final width = (MediaQuery.of(context).size.width - 12) / 3;
    final height = width / aspectRatio;

    return GestureDetector(
      onTap: widget.onTap,
      onLongPress: widget.onLongPress,
      onTapDown: (_) => _scaleController.forward(),
      onTapUp: (_) => _scaleController.reverse(),
      onTapCancel: () => _scaleController.reverse(),
      child: AnimatedBuilder(
        listenable: _scaleAnimation,
        builder: (context, child) {
          return Transform.scale(
            scale: _scaleAnimation.value,
            child: child,
          );
        },
        child: ClipRRect(
          borderRadius: BorderRadius.circular(widget.borderRadius),
          child: SizedBox(
            height: height.clamp(100.0, 280.0),
            child: Stack(
              fit: StackFit.expand,
              children: [
                // Image
                Hero(
                  tag: 'media_${item.id}',
                  child: CachedNetworkImage(
                    imageUrl: item.thumbnailUrl ?? item.displayUrl ?? '',
                    fit: BoxFit.cover,
                    placeholder: (_, __) => Shimmer.fromColors(
                      baseColor: AppColors.surfaceDark,
                      highlightColor: AppColors.elevatedDark,
                      child: Container(color: AppColors.surfaceDark),
                    ),
                    errorWidget: (_, __, ___) => Container(
                      color: AppColors.surfaceDark,
                      child: const Icon(
                        Icons.broken_image_outlined,
                        color: AppColors.textTertiary,
                        size: 24,
                      ),
                    ),
                  ),
                ),

                // Video play icon overlay
                if (item.isVideo)
                  Center(
                    child: Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.6),
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: Colors.white.withOpacity(0.3),
                          width: 1,
                        ),
                      ),
                      child: const Icon(
                        Icons.play_arrow,
                        color: Colors.white,
                        size: 26,
                      ),
                    ),
                  ),

                // Favorite icon
                if (widget.showFavoriteIcon && item.isFavorited)
                  Positioned(
                    top: 6,
                    right: 6,
                    child: GestureDetector(
                      onTap: widget.onFavoriteToggle,
                      child: Container(
                        width: 28,
                        height: 28,
                        decoration: BoxDecoration(
                          color: Colors.black.withOpacity(0.5),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.favorite,
                          color: AppColors.error,
                          size: 14,
                        ),
                      ),
                    ),
                  ),

                // Highlight badge
                if (item.isHighlight)
                  Positioned(
                    top: 6,
                    left: 6,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 6,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.gold.withOpacity(0.9),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: const Icon(
                        Icons.star,
                        color: AppColors.scaffoldDark,
                        size: 10,
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// AnimatedBuilder is just an alias for AnimatedWidget pattern
class AnimatedBuilder extends AnimatedWidget {
  const AnimatedBuilder({
    super.key,
    required super.listenable,
    required this.builder,
    this.child,
  });

  // Using listenable as animation
  Animation<double> get animation => listenable as Animation<double>;

  final Widget Function(BuildContext context, Widget? child) builder;
  final Widget? child;

  @override
  Widget build(BuildContext context) {
    return builder(context, child);
  }
}
