import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';

class LabelMono extends StatelessWidget {
  const LabelMono(this.text, {super.key, this.color});

  final String text;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    return Text(
      text.toUpperCase(),
      style: AppTheme.labelMono(color: color ?? AppColors.textTertiary),
    );
  }
}
