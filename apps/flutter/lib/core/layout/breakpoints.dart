enum LayoutType { mobile, tablet, desktop }

class Breakpoints {
  static const double mobile = 600;
  static const double tablet = 1024;

  static LayoutType of(double width) {
    if (width < mobile) return LayoutType.mobile;
    if (width < tablet) return LayoutType.tablet;
    return LayoutType.desktop;
  }
}
