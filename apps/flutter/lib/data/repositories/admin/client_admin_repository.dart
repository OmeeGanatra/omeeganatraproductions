import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart' as fb;
import '../../models/client_model.dart';

class ClientAdminRepository {
  final _db = FirebaseFirestore.instance;

  Future<List<ClientModel>> listClients() async {
    final snap = await _db
        .collection('clients')
        .orderBy('createdAt', descending: true)
        .get();
    return snap.docs.map((d) => ClientModel.fromFirestore(d)).toList();
  }

  Future<ClientModel> getClient(String id) async {
    final doc = await _db.collection('clients').doc(id).get();
    return ClientModel.fromFirestore(doc);
  }

  Future<ClientModel> createClient(Map<String, dynamic> data) async {
    // Create Firebase Auth account then write the Firestore profile.
    final cred = await fb.FirebaseAuth.instance.createUserWithEmailAndPassword(
      email: data['email'] as String,
      password: data['tempPassword'] as String? ?? 'changeme123!',
    );
    final uid = cred.user!.uid;
    await _db.collection('clients').doc(uid).set({
      'uid': uid,
      'email': data['email'],
      'fullName': data['fullName'] ?? '',
      'phone': data['phone'],
      'tier': data['tier'] ?? 'SIGNATURE',
      'status': 'active',
      'createdAt': FieldValue.serverTimestamp(),
    });
    return getClient(uid);
  }

  Future<void> updateClient(String id, Map<String, dynamic> data) async {
    await _db.collection('clients').doc(id).update(data);
  }

  Future<void> deleteClient(String id) async {
    await _db.collection('clients').doc(id).delete();
  }
}
