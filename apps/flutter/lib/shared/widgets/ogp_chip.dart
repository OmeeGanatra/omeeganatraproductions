import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';

class OgpChip extends StatelessWidget {
  const OgpChip({
    super.key,
    required this.label,
    this.onTap,
    this.isSelected = false,
    this.color,
  });

  final String label;
  final VoidCallback? onTap;
  final bool isSelected;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final baseColor = color ?? AppColors.gold;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected
              ? baseColor.withOpacity(0.25)
              : baseColor.withOpacity(0.1),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: isSelected ? baseColor : baseColor.withOpacity(0.3),
            width: isSelected ? 1.5 : 0.5,
          ),
        ),
        child: Text(
          label,
          style: AppTheme.labelMono(color: baseColor),
        ),
      ),
    );
  }
}
