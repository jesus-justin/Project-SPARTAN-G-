import 'package:flutter/foundation.dart';

const String kBaseUrl = 'http://localhost:3001/api';
const String kBaseUrlWeb = 'http://localhost:3001/api';

String get apiBaseUrl => kIsWeb ? kBaseUrlWeb : kBaseUrl;
