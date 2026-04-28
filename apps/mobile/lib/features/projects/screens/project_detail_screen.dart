import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:shimmer/shimmer.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/endpoints.dart';
import '../../../core/theme/app_theme.dart';
import '../../../models/project.dart';
import '../../../models/gallery.dart';

final projectDetailProvider = StateNotifierProvider.family<
    ProjectDetailNotifier, ProjectDetailState, String>((ref, slug) {
  return ProjectDetailNotifier(slug);
});

class ProjectDetailState {
  final Project? project;
  final List<Gallery> galleries;
  final bool isLoading;
  final String? error;

  const ProjectDetailState({
    this.project,
    this.galleries = const [],
    this.isLoading = false,
    this.error,
  });

  ProjectDetailState copyWith({
    Project? project,
    List<Gallery>? galleries,
    bool? isLoading,
    String? error,
  }) {
    return ProjectDetailState(
      project: project ?? this.project,
      galleries: galleries ?? this.galleries,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class ProjectDetailNotifier extends StateNotifier<ProjectDetailState> {
  ProjectDetailNotifier(this.slug) : super(const ProjectDetailState()) {
    load();
  }

  final String slug;

  Future<void> load() async {
    state = state.copyWith(isLoading: true);

    try {
      final projectRes =
          await ApiClient.instance.get(Endpoints.project(slug));
      final projectData = projectRes.data as Map<String, dynamic>;
      final project =
          Project.fromJson(projectData['project'] ?? projectData);

      final galleriesRes =
          await ApiClient.instance.get(Endpoints.galleries(slug));
      final galData = galleriesRes.data;
      final List<dynamic> galItems = galData is Map
          ? (galData['galleries'] ?? galData['data'] ?? [])
          : galData;
      final galleries = galItems
          .map((g) => Gallery.fromJson(g as Map<String, dynamic>))
          .toList();

      state = state.copyWith(
        project: project,
        galleries: galleries,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Failed to load project details',
      );
    }
  }
}

class ProjectDetailScreen extends ConsumerWidget {
  const ProjectDetailScreen({super.key, required this.slug});

  final String slug;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final detail = ref.watch(projectDetailProvider(slug));

    return Scaffold(
      body: detail.isLoading && detail.project == null
          ? _buildLoadingState()
          : detail.project == null
              ? _buildErrorState(detail.error ?? 'Project not found')
              : _buildContent(context, detail),
    );
  }

  Widget _buildLoadingState() {
    return const Center(
      child: CircularProgressIndicator(color: AppColors.gold),
    );
  }

  Widget _buildErrorState(String error) {
    return Center(
      child: Text(
        error,
        style: GoogleFonts.inter(
          color: AppColors.textSecondary,
          fontSize: 15,
        ),
      ),
    );
  }

  Widget _buildContent(BuildContext context, ProjectDetailState detail) {
    final project = detail.project!;

    return DefaultTabController(
      length: 3,
      child: NestedScrollView(
        headerSliverBuilder: (context, innerBoxIsScrolled) {
          return [
            // Hero image with parallax
            SliverAppBar(
              expandedHeight: 320,
              pinned: true,
              stretch: true,
              backgroundColor: AppColors.scaffoldDark,
              leading: _buildBackButton(context),
              actions: [
                IconButton(
                  onPressed: () {},
                  icon: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.4),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.share_outlined,
                      size: 18,
                      color: Colors.white,
                    ),
                  ),
                ),
              ],
              flexibleSpace: FlexibleSpaceBar(
                stretchModes: const [
                  StretchMode.zoomBackground,
                  StretchMode.blurBackground,
                ],
                background: Stack(
                  fit: StackFit.expand,
                  children: [
                    if (project.coverImageUrl != null)
                      CachedNetworkImage(
                        imageUrl: project.coverImageUrl!,
                        fit: BoxFit.cover,
                        placeholder: (_, __) => Container(
                          color: AppColors.surfaceDark,
                        ),
                        errorWidget: (_, __, ___) => Container(
                          color: AppColors.surfaceDark,
                          child: const Icon(Icons.image, size: 60),
                        ),
                      )
                    else
                      Container(color: AppColors.surfaceDark),

                    // Gradient overlay
                    Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [
                            Colors.black.withOpacity(0.2),
                            Colors.transparent,
                            Colors.black.withOpacity(0.8),
                          ],
                          stops: const [0, 0.4, 1],
                        ),
                      ),
                    ),

                    // Project info overlay
                    Positioned(
                      left: 20,
                      right: 20,
                      bottom: 60,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (project.eventType != null) ...[
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 4,
                              ),
                              decoration: BoxDecoration(
                                color: AppColors.gold.withOpacity(0.25),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                project.eventType!.toUpperCase(),
                                style: GoogleFonts.inter(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.gold,
                                  letterSpacing: 1.5,
                                ),
                              ),
                            ),
                            const SizedBox(height: 12),
                          ],
                          Text(
                            project.title,
                            style: GoogleFonts.playfairDisplay(
                              fontSize: 30,
                              fontWeight: FontWeight.w700,
                              color: Colors.white,
                              height: 1.1,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              if (project.formattedDate.isNotEmpty) ...[
                                Icon(
                                  Icons.calendar_today_outlined,
                                  size: 13,
                                  color: Colors.white.withOpacity(0.7),
                                ),
                                const SizedBox(width: 6),
                                Text(
                                  project.formattedDate,
                                  style: GoogleFonts.inter(
                                    fontSize: 13,
                                    color: Colors.white.withOpacity(0.7),
                                  ),
                                ),
                              ],
                              if (project.locationString.isNotEmpty) ...[
                                const SizedBox(width: 16),
                                Icon(
                                  Icons.location_on_outlined,
                                  size: 13,
                                  color: Colors.white.withOpacity(0.7),
                                ),
                                const SizedBox(width: 4),
                                Expanded(
                                  child: Text(
                                    project.locationString,
                                    overflow: TextOverflow.ellipsis,
                                    style: GoogleFonts.inter(
                                      fontSize: 13,
                                      color: Colors.white.withOpacity(0.7),
                                    ),
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Tab bar
            SliverPersistentHeader(
              pinned: true,
              delegate: _TabBarDelegate(
                TabBar(
                  labelColor: AppColors.gold,
                  unselectedLabelColor: AppColors.textTertiary,
                  indicatorColor: AppColors.gold,
                  indicatorSize: TabBarIndicatorSize.label,
                  indicatorWeight: 2.5,
                  labelStyle: GoogleFonts.inter(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                  unselectedLabelStyle: GoogleFonts.inter(
                    fontSize: 14,
                    fontWeight: FontWeight.w400,
                  ),
                  tabs: const [
                    Tab(text: 'Galleries'),
                    Tab(text: 'Timeline'),
                    Tab(text: 'About'),
                  ],
                ),
              ),
            ),
          ];
        },
        body: TabBarView(
          children: [
            // Galleries tab
            _GalleriesTab(
              galleries: detail.galleries,
              projectSlug: slug,
            ),

            // Timeline tab
            _TimelineTab(projectSlug: slug),

            // About tab
            _AboutTab(project: project),
          ],
        ),
      ),
    );
  }

  Widget _buildBackButton(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(8),
      child: GestureDetector(
        onTap: () => context.go('/projects'),
        child: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: Colors.black.withOpacity(0.4),
            shape: BoxShape.circle,
          ),
          child: const Icon(
            Icons.arrow_back_ios_new,
            size: 16,
            color: Colors.white,
          ),
        ),
      ),
    );
  }
}

class _TabBarDelegate extends SliverPersistentHeaderDelegate {
  final TabBar tabBar;

  _TabBarDelegate(this.tabBar);

  @override
  double get minExtent => tabBar.preferredSize.height;

  @override
  double get maxExtent => tabBar.preferredSize.height;

  @override
  Widget build(
    BuildContext context,
    double shrinkOffset,
    bool overlapsContent,
  ) {
    return Container(
      color: AppColors.scaffoldDark,
      child: tabBar,
    );
  }

  @override
  bool shouldRebuild(covariant _TabBarDelegate oldDelegate) => false;
}

class _GalleriesTab extends StatelessWidget {
  const _GalleriesTab({
    required this.galleries,
    required this.projectSlug,
  });

  final List<Gallery> galleries;
  final String projectSlug;

  @override
  Widget build(BuildContext context) {
    if (galleries.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.collections_outlined,
              size: 48,
              color: AppColors.textTertiary.withOpacity(0.3),
            ),
            const SizedBox(height: 12),
            Text(
              'Galleries coming soon',
              style: GoogleFonts.inter(
                fontSize: 15,
                color: AppColors.textTertiary,
              ),
            ),
          ],
        ),
      );
    }

    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 0.85,
        mainAxisSpacing: 16,
        crossAxisSpacing: 16,
      ),
      itemCount: galleries.length,
      itemBuilder: (context, index) {
        final gallery = galleries[index];
        return _GalleryCard(
          gallery: gallery,
          onTap: () {
            context.go(
              '/projects/$projectSlug/galleries/${gallery.id}',
            );
          },
        );
      },
    );
  }
}

class _GalleryCard extends StatelessWidget {
  const _GalleryCard({required this.gallery, required this.onTap});

  final Gallery gallery;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: const Color(0xFF2A2A2A),
            width: 0.5,
          ),
        ),
        clipBehavior: Clip.antiAlias,
        child: Stack(
          fit: StackFit.expand,
          children: [
            if (gallery.coverImageUrl != null)
              CachedNetworkImage(
                imageUrl: gallery.coverImageUrl!,
                fit: BoxFit.cover,
                placeholder: (_, __) => Shimmer.fromColors(
                  baseColor: AppColors.surfaceDark,
                  highlightColor: AppColors.elevatedDark,
                  child: Container(color: AppColors.surfaceDark),
                ),
                errorWidget: (_, __, ___) => Container(
                  color: AppColors.surfaceDark,
                  child: const Icon(Icons.image, color: AppColors.textTertiary),
                ),
              )
            else
              Container(
                color: AppColors.surfaceDark,
                child: const Icon(
                  Icons.collections_outlined,
                  color: AppColors.textTertiary,
                ),
              ),

            // Gradient overlay
            Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.transparent,
                    Colors.black.withOpacity(0.75),
                  ],
                  stops: const [0.4, 1.0],
                ),
              ),
            ),

            // Content
            Positioned(
              left: 12,
              right: 12,
              bottom: 12,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    gallery.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.playfairDisplay(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(
                        Icons.photo_outlined,
                        size: 12,
                        color: AppColors.gold.withOpacity(0.8),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '${gallery.mediaCount} photos',
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          color: Colors.white.withOpacity(0.7),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TimelineTab extends StatelessWidget {
  const _TimelineTab({required this.projectSlug});

  final String projectSlug;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          OutlinedButton.icon(
            onPressed: () => context.go('/projects/$projectSlug/timeline'),
            icon: const Icon(Icons.timeline),
            label: const Text('View Full Timeline'),
          ),
        ],
      ),
    );
  }
}

class _AboutTab extends StatelessWidget {
  const _AboutTab({required this.project});

  final Project project;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (project.description != null &&
              project.description!.isNotEmpty) ...[
            Text(
              'About',
              style: GoogleFonts.playfairDisplay(
                fontSize: 20,
                fontWeight: FontWeight.w600,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              project.description!,
              style: GoogleFonts.inter(
                fontSize: 15,
                color: AppColors.textSecondary,
                height: 1.6,
              ),
            ),
            const SizedBox(height: 32),
          ],

          // Details
          _DetailRow(
            icon: Icons.calendar_today_outlined,
            label: 'Date',
            value: project.formattedDate,
          ),
          if (project.venue != null)
            _DetailRow(
              icon: Icons.location_on_outlined,
              label: 'Venue',
              value: project.venue!,
            ),
          if (project.city != null)
            _DetailRow(
              icon: Icons.map_outlined,
              label: 'City',
              value: project.city!,
            ),
          if (project.eventType != null)
            _DetailRow(
              icon: Icons.celebration_outlined,
              label: 'Event Type',
              value: project.eventType!,
            ),
          _DetailRow(
            icon: Icons.collections_outlined,
            label: 'Galleries',
            value: '${project.galleryCount}',
          ),
          _DetailRow(
            icon: Icons.photo_library_outlined,
            label: 'Total Photos',
            value: '${project.totalMediaCount}',
          ),
        ],
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  const _DetailRow({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    if (value.isEmpty) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: AppColors.gold.withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: AppColors.gold, size: 18),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    color: AppColors.textTertiary,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: GoogleFonts.inter(
                    fontSize: 15,
                    fontWeight: FontWeight.w500,
                    color: AppColors.textPrimary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
