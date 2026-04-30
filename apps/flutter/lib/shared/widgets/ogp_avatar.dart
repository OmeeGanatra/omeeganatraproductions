import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../core/theme/app_theme.dart';

class OgpAvatar extends StatelessWidget {
  const OgpAvatar({
    super.key,
    this.imageUrl,
    this.initials,
    this.size = 40,
  });

  final String? imageUrl;
  final String? initials;
  final double size;

  @override
  Widget build(BuildContext context) {
    if (imageUrl != null && imageUrl!.isNotEmpty) {
      return ClipOval(
        child: CachedNetworkImage(
          imageUrl: imageUrl!,
          width: size,
          height: size,
          fit: BoxFit.cover,
          placeholder: (_, __) => _placeholder(),
          errorWidget: (_, __, ___) => _placeholder(),
        ),
      );
    }
    return _placeholder();
  }

  Widget _placeholder() {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: AppColors.gold.withOpacity(0.15),
        border: Border.all(color: AppColors.gold.withOpacity(0.3), width: 1),
      ),
      alignment: Alignment.center,
      child: Text(
        initials ?? '?',
        style: TextStyle(
          color: AppColors.gold,
          fontSize: size * 0.35,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
