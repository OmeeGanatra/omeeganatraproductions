import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_staggered_grid_view/flutter_staggered_grid_view.dart';
import 'package:shimmer/shimmer.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/endpoints.dart';
import '../../../core/theme/app_theme.dart';
import '../../../models/media_item.dart';
import '../../galleries/widgets/photo_tile.dart';

class FavoriteGroup {
  final String projectTitle;
  final String projectSlug;
  final List<MediaItem> items;

  const FavoriteGroup({
    required this.projectTitle,
    required this.projectSlug,
    required this.items,
  });
}

final favoritesProvider =
    StateNotifierProvider<FavoritesNotifier, FavoritesState>((ref) {
  return FavoritesNotifier();
});

class FavoritesState {
  final List<FavoriteGroup> groups;
  final bool isLoading;
  final String? error;

  const FavoritesState({
    this.groups = const [],
    this.isLoading = false,
    this.error,
  });

  int get totalCount =>
      groups.fold(0, (sum, group) => sum + group.items.length);

  FavoritesState copyWith({
    List<FavoriteGroup>? groups,
    bool? isLoading,
    String? error,
  }) {
    return FavoritesState(
      groups: groups ?? this.groups,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class FavoritesNotifier extends StateNotifier<FavoritesState> {
  FavoritesNotifier() : super(const FavoritesState()) {
    loadFavorites();
  }

  Future<void> loadFavorites() async {
    state = state.copyWith(isLoading: true);

    try {
      final response = await ApiClient.instance.get(Endpoints.favorites);
      final data = response.data;

      // Parse grouped favorites
      final List<FavoriteGroup> groups = [];

      if (data is Map && data['groups'] != null) {
        for (final group in data['groups']) {
          final items = (group['items'] as List)
              .map((m) => MediaItem.fromJson(m as Map<String, dynamic>))
              .toList();
          groups.add(FavoriteGroup(
            projectTitle: group['projectTitle'] as String? ?? '',
            projectSlug: group['projectSlug'] as String? ?? '',
            items: items,
          ));
        }
      } else if (data is Map && data['favorites'] != null) {
        final items = (data['favorites'] as List)
            .map((m) => MediaItem.fromJson(m as Map<String, dynamic>))
            .toList();
        if (items.isNotEmpty) {
          groups.add(FavoriteGroup(
            projectTitle: 'All Favorites',
            projectSlug: '',
            items: items,
          ));
        }
      }

      state = state.copyWith(groups: groups, isLoading: false);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Failed to load favorites',
      );
    }
  }

  void removeFavorite(String mediaId) async {
    // Optimistic update
    final newGroups = state.groups.map((group) {
      return FavoriteGroup(
        projectTitle: group.projectTitle,
        projectSlug: group.projectSlug,
        items: group.items.where((m) => m.id != mediaId).toList(),
      );
    }).where((g) => g.items.isNotEmpty).toList();

    state = state.copyWith(groups: newGroups);

    try {
      await ApiClient.instance.post(Endpoints.toggleFavorite(mediaId));
    } catch (_) {
      // Reload on error
      loadFavorites();
    }
  }
}

class FavoritesScreen extends ConsumerWidget {
  const FavoritesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final favState = ref.watch(favoritesProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Favorites',
          style: GoogleFonts.playfairDisplay(
            fontSize: 24,
            fontWeight: FontWeight.w600,
          ),
        ),
        actions: [
          if (favState.totalCount > 0)
            Padding(
              padding: const EdgeInsets.only(right: 16),
              child: Center(
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.gold.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    '${favState.totalCount}',
                    style: GoogleFonts.inter(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: AppColors.gold,
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
      body: RefreshIndicator(
        color: AppColors.gold,
        backgroundColor: AppColors.surfaceDark,
        onRefresh: () => ref.read(favoritesProvider.notifier).loadFavorites(),
        child: _buildBody(context, ref, favState),
      ),
    );
  }

  Widget _buildBody(
      BuildContext context, WidgetRef ref, FavoritesState state) {
    if (state.isLoading && state.groups.isEmpty) {
      return _buildShimmerGrid();
    }

    if (state.error != null && state.groups.isEmpty) {
      return Center(
        child: Text(
          state.error!,
          style: GoogleFonts.inter(
            color: AppColors.textSecondary,
            fontSize: 15,
          ),
        ),
      );
    }

    if (state.groups.isEmpty) {
      return _buildEmptyState();
    }

    return CustomScrollView(
      slivers: [
        for (final group in state.groups) ...[
          // Section header
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 20, 16, 8),
            sliver: SliverToBoxAdapter(
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      group.projectTitle,
                      style: GoogleFonts.playfairDisplay(
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimary,
                      ),
                    ),
                  ),
                  Text(
                    '${group.items.length} photos',
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      color: AppColors.textTertiary,
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Grid
          SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: 3),
            sliver: SliverMasonryGrid.count(
              crossAxisCount: 3,
              mainAxisSpacing: 3,
              crossAxisSpacing: 3,
              childCount: group.items.length,
              itemBuilder: (context, index) {
                final item = group.items[index];
                return PhotoTile(
                  mediaItem: item,
                  onTap: () => context.go('/media/${item.id}'),
                  onFavoriteToggle: () {
                    ref
                        .read(favoritesProvider.notifier)
                        .removeFavorite(item.id);
                  },
                );
              },
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: AppColors.gold.withOpacity(0.08),
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.favorite_outline,
              size: 40,
              color: AppColors.gold.withOpacity(0.4),
            ),
          ),
          const SizedBox(height: 20),
          Text(
            'No favorites yet',
            style: GoogleFonts.playfairDisplay(
              fontSize: 22,
              fontWeight: FontWeight.w600,
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Tap the heart on photos you love\nto find them here later',
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(
              fontSize: 14,
              color: AppColors.textTertiary,
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildShimmerGrid() {
    return MasonryGridView.count(
      crossAxisCount: 3,
      mainAxisSpacing: 3,
      crossAxisSpacing: 3,
      padding: const EdgeInsets.all(3),
      itemCount: 12,
      itemBuilder: (context, index) {
        final height = 120.0 + (index % 3) * 40.0;
        return Shimmer.fromColors(
          baseColor: AppColors.surfaceDark,
          highlightColor: AppColors.elevatedDark,
          child: Container(
            height: height,
            decoration: BoxDecoration(
              color: AppColors.surfaceDark,
              borderRadius: BorderRadius.circular(4),
            ),
          ),
        );
      },
    );
  }
}
