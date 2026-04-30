import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/api/api_client.dart';
import '../../../../data/models/client_model.dart';
import '../../../../data/repositories/admin/client_admin_repository.dart';

final _repo = ClientAdminRepository(ApiClient.instance);

final adminClientsProvider = FutureProvider<List<ClientModel>>((ref) async {
  return _repo.listClients();
});

final adminClientDetailProvider =
    FutureProvider.family<ClientModel, String>((ref, id) async {
  return _repo.getClient(id);
});
