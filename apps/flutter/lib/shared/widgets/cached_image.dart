import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../core/theme/app_theme.dart';
import 'ogp_shimmer.dart';

class CachedImage extends StatelessWidget {
  const CachedImage({
    super.key,
    required this.url,
    this.fit = BoxFit.cover,
    this.width,
    this.height,
    this.borderRadius = 0,
    this.placeholder,
  });

  final String url;
  final BoxFit fit;
  final double? width;
  final double? height;
  final double borderRadius;
  final Widget? placeholder;

  @override
  Widget build(BuildContext context) {
    final shimmer = placeholder ??
        OgpShimmer(
          child: Container(
            width: width,
            height: height,
            decoration: BoxDecoration(
              color: AppColors.cardDark,
              borderRadius: BorderRadius.circular(borderRadius),
            ),
          ),
        );

    Widget image = CachedNetworkImage(
      imageUrl: url,
      width: width,
      height: height,
      fit: fit,
      placeholder: (_, __) => shimmer,
      errorWidget: (_, __, ___) => Container(
        width: width,
        height: height,
        color: AppColors.surfaceDark,
        child: const Icon(Icons.broken_image_outlined, color: AppColors.textTertiary),
      ),
    );

    if (borderRadius > 0) {
      image = ClipRRect(
        borderRadius: BorderRadius.circular(borderRadius),
        child: image,
      );
    }

    return image;
  }
}
