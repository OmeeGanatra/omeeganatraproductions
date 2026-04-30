import '../../../core/api/api_client.dart';
import '../../../core/api/endpoints.dart';
import '../../models/client_model.dart';

class ClientAdminRepository {
  const ClientAdminRepository(this._api);
  final ApiClient _api;

  Future<List<ClientModel>> listClients() async {
    final r = await _api.get(Endpoints.adminClients);
    final data = r.data;
    final items = data is Map ? (data['clients'] ?? data['data'] ?? []) : data;
    return (items as List)
        .map((j) => ClientModel.fromJson(j as Map<String, dynamic>))
        .toList();
  }

  Future<ClientModel> getClient(String id) async {
    final r = await _api.get(Endpoints.adminClient(id));
    final data = r.data;
    final json = data is Map && data['client'] != null
        ? data['client'] as Map<String, dynamic>
        : data as Map<String, dynamic>;
    return ClientModel.fromJson(json);
  }

  Future<ClientModel> createClient(Map<String, dynamic> body) async {
    final r = await _api.post(Endpoints.adminClients, data: body);
    final data = r.data;
    final json = data is Map && data['client'] != null
        ? data['client'] as Map<String, dynamic>
        : data as Map<String, dynamic>;
    return ClientModel.fromJson(json);
  }

  Future<ClientModel> updateClient(String id, Map<String, dynamic> body) async {
    final r = await _api.put(Endpoints.adminClient(id), data: body);
    final data = r.data;
    final json = data is Map && data['client'] != null
        ? data['client'] as Map<String, dynamic>
        : data as Map<String, dynamic>;
    return ClientModel.fromJson(json);
  }

  Future<void> deleteClient(String id) async {
    await _api.delete(Endpoints.adminClient(id));
  }
}
