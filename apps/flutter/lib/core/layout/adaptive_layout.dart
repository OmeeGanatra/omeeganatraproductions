import 'package:flutter/material.dart';
import 'breakpoints.dart';

class AdaptiveLayout extends StatelessWidget {
  const AdaptiveLayout({
    super.key,
    required this.mobileBuilder,
    this.tabletBuilder,
    this.desktopBuilder,
  });

  final WidgetBuilder mobileBuilder;
  final WidgetBuilder? tabletBuilder;
  final WidgetBuilder? desktopBuilder;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final layout = Breakpoints.of(constraints.maxWidth);
        switch (layout) {
          case LayoutType.desktop:
            return (desktopBuilder ?? tabletBuilder ?? mobileBuilder)(context);
          case LayoutType.tablet:
            return (tabletBuilder ?? mobileBuilder)(context);
          case LayoutType.mobile:
            return mobileBuilder(context);
        }
      },
    );
  }
}
