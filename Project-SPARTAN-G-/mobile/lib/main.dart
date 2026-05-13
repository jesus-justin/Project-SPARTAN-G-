import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'app.dart';
import 'core/providers/auth_provider.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final AuthProvider authProvider = AuthProvider();
  await authProvider.initialize();
  runApp(
    ChangeNotifierProvider<AuthProvider>.value(
      value: authProvider,
      child: SpartanGApp(authProvider: authProvider),
    ),
  );
}
